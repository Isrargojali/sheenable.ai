import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Sends cookies (needed for refresh token)
});

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = (useAuthStore.getState() as { token?: string }).token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token when it expires
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        useAuthStore.setState({ token: data.token });
        original.headers.Authorization = `Bearer ${data.token}`;
        return api(original); // Retry the original request with new token
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const apiAuth = {
  register:  (data: object)                    => api.post('/auth/register', data),
  verifyOTP: (userId: string, code: string)    => api.post('/auth/verify-otp', { userId, code }),
  resendOTP: (userId: string)                  => api.post('/auth/resend-otp', { userId }),
  login:     (email: string, password: string) => api.post('/auth/login', { email, password }),
  refresh:   ()                                => api.post('/auth/refresh'),
  logout:    ()                                => api.post('/auth/logout'),
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const apiProfile = {
  getMe:               ()                    => api.get('/profile/me'),
  updateProfile:       (data: object)        => api.put('/profile/me', data),
  getCandidateStats:   ()                    => api.get('/profile/candidate-stats'),
  getUpcomingInterviews: ()                  => api.get('/profile/upcoming-interviews'),
  updateAvailability:  (isAvailable: boolean)=> api.put('/profile/availability', { isAvailable }),
};

// ─── JOBS ─────────────────────────────────────────────────────────────────────
export const apiJobs = {
  getJobs:          (params: object)          => api.get('/jobs', { params }),
  getJobById:       (id: string)              => api.get(`/jobs/${id}`),
  getRecommendations: ()                      => api.get('/jobs/recommendations'),
  postJob:          (data: object)            => api.post('/jobs', data),
  updateJob:        (id: string, data: object)=> api.put(`/jobs/${id}`, data),
  deleteJob:        (id: string)              => api.delete(`/jobs/${id}`),
  saveJob:          (id: string)              => api.post(`/jobs/${id}/save`),
  unsaveJob:        (id: string)              => api.delete(`/jobs/${id}/save`),
  getSavedJobs:     ()                        => api.get('/jobs/saved'),
  getMyListings:    (params?: object)         => api.get('/jobs/my-listings', { params }),
};

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
export const apiApplications = {
  apply:           (jobId: string, data: object) => api.post(`/jobs/${jobId}/apply`, data),
  getApplications: (params?: object)             => api.get('/applications', { params }),
  updateStatus:    (id: string, status: string)  => api.put(`/applications/${id}/status`, { status }),
  withdraw:        (id: string)                  => api.post(`/applications/${id}/withdraw`),
};

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
export const apiMessages = {
  getThreads:   ()                               => api.get('/messages/threads'),
  getMessages:  (threadId: string)               => api.get(`/messages/threads/${threadId}`),
  sendMessage:  (threadId: string, content: string) => api.post(`/messages/threads/${threadId}`, { content }),
  markRead:     (threadId: string)               => api.put(`/messages/threads/${threadId}/read`),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const apiNotifications = {
  getAll:  ()           => api.get('/notifications'),
  markRead:(id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: ()       => api.put('/notifications/read-all'),
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const apiAdmin = {
  getUsers:       (params?: object)          => api.get('/admin/users', { params }),
  getUserById:    (id: string)               => api.get(`/admin/users/${id}`),
  updateUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  updateStatus:   (id: string, isActive: boolean) => api.patch(`/admin/users/${id}/status`, { isActive }),
  deleteUser:     (id: string)               => api.delete(`/admin/users/${id}`),
  getAuditLogs:   (params?: object)          => api.get('/admin/audit-logs', { params }),
  getSecurity:    ()                         => api.get('/admin/security'),
  getStats:       ()                         => api.get('/admin/stats'),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const apiAI = {
  generateCV:       (data: object)                          => api.post('/ai/cv-builder', data),
  improveCVSection: (section: string, text: string)         => api.post('/ai/improve-cv', { section, text }),
  searchCandidates: (query: string, params?: object)        => api.get('/ai/search-candidates', { params: { ...params, q: query } }),
  analyzeProfile:   (userId: string)                        => api.post('/ai/analyze-profile', { userId }),
};

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────
export const apiInterviews = {
  getInterviews:    (params?: object)          => api.get('/interviews', { params }),
  scheduleInterview:(data: object)             => api.post('/interviews', data),
  updateInterview:  (id: string, data: object) => api.put(`/interviews/${id}`, data),
  cancelInterview:  (id: string)               => api.delete(`/interviews/${id}/cancel`),
};

// ─── UPLOAD ───────────────────────────────────────────────────────────────────
export const apiUpload = {
  uploadAvatar: (formData: FormData) => api.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCV:     (formData: FormData) => api.post('/upload/cv',     formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ─── PIPELINE ─────────────────────────────────────────────────────────────────
export const apiPipeline = {
  getPipeline:       (jobId: string)              => api.get(`/applications/pipeline/${jobId}`),
  bulkUpdateStatus:  (data: object)               => api.put('/applications/bulk-status', data),
  updateNotes:       (id: string, notes: string)  => api.put(`/applications/${id}/notes`, { notes }),
  getApplicationById:(id: string)                 => api.get(`/applications/${id}`),
  updateStatus:      (id: string, status: string, data?: object) => api.put(`/applications/${id}/status`, { status, ...data }),
  getStats:          ()                           => api.get('/applications/stats'),
};