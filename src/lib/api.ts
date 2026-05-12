import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true, // Sends cookies (needed for refresh token)
});

// ─── REQUEST INTERCEPTOR — attach JWT from authStore ─────────────────────────
api.interceptors.request.use((config) => {
  const token = (useAuthStore.getState() as { token?: string }).token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── RESPONSE INTERCEPTOR — auto-refresh on 401 ──────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (val: unknown) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.token;
        useAuthStore.setState({ token: newToken });
        original.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const apiAuth = {
  login:           (email: string, password: string)           => api.post('/auth/login', { email, password }),
  register:        (data: object)                              => api.post('/auth/register', data),
  verifyOTP:       (userId: string, code: string)              => api.post('/auth/verify-otp', { userId, code }),
  resendOTP:       (userId: string)                            => api.post('/auth/resend-otp', { userId }),
  logout:          ()                                          => api.post('/auth/logout'),
  forgotPassword:  (email: string)                             => api.post('/auth/forgot-password', { email }),
  resetPassword:   (token: string, newPassword: string)        => api.post('/auth/reset-password', { token, newPassword }),
  getMe:           ()                                          => api.get('/auth/me'),
  refresh:         ()                                          => api.post('/auth/refresh'),
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const apiProfile = {
  getMe:                  ()                      => api.get('/profile/me'),
  updateMe:               (data: object)          => api.put('/profile/me', data),
  getCandidateStats:      ()                      => api.get('/profile/candidate-stats'),
  getUpcomingInterviews:  ()                      => api.get('/profile/upcoming-interviews'),
  getCandidateProfile:    ()                      => api.get('/profile/candidate'),
  updateCandidateProfile: (data: object)          => api.put('/profile/candidate', data),
  getEmployerProfile:     ()                      => api.get('/profile/employer'),
  updateEmployerProfile:  (data: object)          => api.put('/profile/employer', data),
  toggleAvailability:     (isAvailable: boolean)  => api.put('/profile/availability', { isAvailable }),
  uploadAvatar:           (formData: FormData)    => api.post('/profile/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getCv:                  ()                      => api.get('/profile/cv'),
  saveCv:                 (data: object)          => api.put('/profile/cv', data),
  // Convenience: updateProfile (alias for updateMe)
  updateProfile:          (data: object)          => api.put('/profile/me', data),
};

// ─── JOBS ─────────────────────────────────────────────────────────────────────
export const apiJobs = {
  getJobs:           (params?: object)             => api.get('/jobs', { params }),
  getJobById:        (id: string)                  => api.get(`/jobs/${id}`),
  postJob:           (data: object)                => api.post('/jobs', data),
  updateJob:         (id: string, data: object)    => api.put(`/jobs/${id}`, data),
  deleteJob:         (id: string)                  => api.delete(`/jobs/${id}`),
  getMyListings:     (params?: object)             => api.get('/jobs/my-listings', { params }),
  saveJob:           (id: string)                  => api.post(`/jobs/${id}/save`),
  unsaveJob:         (id: string)                  => api.delete(`/jobs/${id}/save`),
  getSavedJobs:      ()                            => api.get('/jobs/saved'),
  getRecommendations:()                            => api.get('/jobs/recommendations'),
};

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
export const apiApplications = {
  apply:            (jobId: string, data: object)  => api.post(`/applications/${jobId}/apply`, data),
  getApplications:  (params?: object)              => api.get('/applications', { params }),
  getById:          (id: string)                   => api.get(`/applications/${id}`),
  updateStatus:     (id: string, status: string, data?: object) =>
                      api.put(`/applications/${id}/status`, { status, ...data }),
  withdraw:         (id: string)                   => api.post(`/applications/${id}/withdraw`),
  getPipeline:      (jobId: string)                => api.get(`/applications/pipeline/${jobId}`),
  bulkUpdateStatus: (applicationIds: string[], status: string) =>
                      api.put('/applications/bulk-status', { applicationIds, status }),
  addNote:          (id: string, notes: string)    => api.put(`/applications/${id}/notes`, { notes }),
  getStats:         ()                             => api.get('/applications/stats'),
};

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
export const apiMessages = {
  getThreads:     ()                                 => api.get('/messages/threads'),
  startThread:    (data: { recipientId: string; jobId?: string; initialMessage?: string }) =>
                    api.post('/messages/threads', data),
  getMessages:    (threadId: string, params?: object) => api.get(`/messages/threads/${threadId}`, { params }),
  sendMessage:    (threadId: string, content: string) => api.post(`/messages/threads/${threadId}`, { content }),
  markRead:       (threadId: string)                 => api.put(`/messages/threads/${threadId}/read`),
  getUnreadCount: ()                                 => api.get('/messages/unread-count'),
};

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────
export const apiInterviews = {
  schedule:  (data: object)                         => api.post('/interviews', data),
  getAll:    (params?: object)                      => api.get('/interviews', { params }),
  getById:   (id: string)                           => api.get(`/interviews/${id}`),
  update:    (id: string, data: object)             => api.put(`/interviews/${id}`, data),
  cancel:    (id: string, cancelReason?: string)    => api.post(`/interviews/${id}/cancel`, { cancelReason }),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const apiNotifications = {
  getAll:         (params?: object) => api.get('/notifications', { params }),
  markRead:       (id: string)      => api.put(`/notifications/${id}/read`),
  markAllRead:    ()                => api.put('/notifications/read-all'),
  delete:         (id: string)      => api.delete(`/notifications/${id}`),
  getUnreadCount: ()                => api.get('/notifications/unread-count'),
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const apiAdmin = {
  getStats:         ()                                  => api.get('/admin/stats'),
  getUsers:         (params?: object)                   => api.get('/admin/users', { params }),
  getUserById:      (id: string)                        => api.get(`/admin/users/${id}`),
  updateUserRole:   (id: string, role: string)          => api.patch(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id: string, isActive: boolean)     => api.patch(`/admin/users/${id}/status`, { isActive }),
  deleteUser:       (id: string)                        => api.delete(`/admin/users/${id}`),
  getAuditLogs:     (params?: object)                   => api.get('/admin/audit-logs', { params }),
  getSecurityInfo:  ()                                  => api.get('/admin/security'),
  getAnalytics:     (period?: '7d' | '30d' | '90d')    => api.get('/admin/analytics', { params: { period } }),
  getJobs:          (params?: object)                   => api.get('/admin/jobs', { params }),
  updateJobStatus:  (jobId: string, status: string)     => api.put(`/admin/jobs/${jobId}/status`, { status }),
};

// ─── UPLOAD (direct upload helpers) ──────────────────────────────────────────
export const apiUpload = {
  uploadAvatar: (formData: FormData) =>
    api.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCv:     (formData: FormData) =>
    api.post('/upload/cv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Legacy aliases for backward compatibility with existing components
export const apiAI = {
  generateCV:       (data: object)                  => api.post('/ai/cv-builder', data),
  improveCVSection: (section: string, text: string) => api.post('/ai/improve-cv', { section, text }),
  searchCandidates: (query: string, params?: object)=> api.get('/ai/search-candidates', { params: { ...params, q: query } }),
  analyzeProfile:   (userId: string)                => api.post('/ai/analyze-profile', { userId }),
};

// Legacy: some components use apiPipeline directly
export const apiPipeline = {
  getPipeline:       (jobId: string)               => apiApplications.getPipeline(jobId),
  bulkUpdateStatus:  (applicationIds: string[], status: string) => apiApplications.bulkUpdateStatus(applicationIds, status),
  updateNotes:       (id: string, notes: string)   => apiApplications.addNote(id, notes),
  getApplicationById:(id: string)                  => apiApplications.getById(id),
  updateStatus:      (id: string, status: string, data?: object) => apiApplications.updateStatus(id, status, data),
  getStats:          ()                            => apiApplications.getStats(),
};