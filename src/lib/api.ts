import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true, // Sends cookies (needed for refresh token)
});

// Suppress uncaught Chrome extension errors that don't affect API calls
if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
  (window as any).chrome.runtime.onMessage?.addListener?.(() => {
    // This prevents "Receiving end does not exist" errors from cluttering console
  });
}

// ─── REQUEST INTERCEPTOR — attach JWT from authStore ─────────────────────────
api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }
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

    if (error.response?.status === 401 && !original._retry && original.url !== '/auth/login' && original.url !== '/auth/refresh-token') {
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
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const newToken = data.data?.token || data.token; // Handle standard vs custom apiResponse wrapped responses
        if (!newToken) throw new Error('No token returned');
        
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
  login: (email: string, password: string, role?: string) => {
    return api.post('/auth/login', { email, password, role });
  },
  register: (data: object) => api.post('/auth/register', data),
  verifyOTP: (userId: string, code: string) => api.post('/auth/verify-otp', { userId, code }),
  resendOTP: (userId: string) => api.post('/auth/resend-otp', { userId }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
  getMe: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh-token'),
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const apiProfile = {
  getMe: () => api.get('/profile/me'),
  updateMe: (data: object) => api.put('/profile/me', data),
  getCandidateStats: () => api.get('/profile/candidate-stats'), // Currently unused in backend, stub here
  getUpcomingInterviews: () => api.get('/interviews', { params: { upcoming: 'true' } }),
  getCandidateProfile: (id: string) => api.get(`/profile/candidate/${id}`),
  updateCandidateProfile: (data: object) => api.put('/profile/me', data),
  getEmployerProfile: (id: string) => api.get(`/profile/employer/${id}`),
  updateEmployerProfile: (data: object) => api.put('/profile/me', data),
  toggleAvailability: (isAvailable: boolean) => api.put('/profile/me', { isAvailable }),
  uploadAvatar: (formData: FormData) => api.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getCv: () => api.get('/profile/cv'),
  saveCv: (data: object) => api.post('/profile/cv', data),
  updateProfile: (data: object) => api.put('/profile/me', data),
};

// ─── JOBS ─────────────────────────────────────────────────────────────────────
export const apiJobs = {
  getJobs: (params?: object) => api.get('/jobs', { params }),
  getJobById: (id: string) => api.get(`/jobs/${id}`),
  postJob: (data: object) => api.post('/jobs', data),
  updateJob: (id: string, data: object) => api.put(`/jobs/${id}`, data),
  deleteJob: (id: string) => api.delete(`/jobs/${id}`),
  getMyListings: (params?: object) => api.get('/jobs/me', { params }),
  saveJob: (id: string) => api.post(`/jobs/${id}/save`),
  getSavedJobs: () => api.get('/jobs/saved'),
  getRecommendations: () => api.get('/jobs/recommended'),
};

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
export const apiApplications = {
  apply: (jobId: string, data: object) => api.post(`/applications/${jobId}/apply`, data),
  getApplications: (params?: object) => api.get('/applications/me', { params }),
  getJobApplications: (jobId: string, params?: object) => api.get(`/applications/job/${jobId}`, { params }),
  updateStatus: (id: string, status: string, data?: object) =>
    api.patch(`/applications/${id}/status`, { status, ...data }),
  getPipeline: (jobId: string) => api.get(`/applications/job/${jobId}/pipeline`),
  bulkUpdateStatus: (applicationIds: string[], status: string) =>
    api.patch('/applications/bulk-status', { applicationIds, status }),
};

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
export const apiMessages = {
  getThreads: () => api.get('/messages/threads'),
  startThread: (data: { recipientId: string; jobId?: string; initialMessage?: string }) =>
    api.post('/messages/send', { receiverId: data.recipientId, jobId: data.jobId, content: data.initialMessage }),
  getMessages: (threadId: string, params?: object) => api.get(`/messages/threads/${threadId}/messages`, { params }),
  sendMessage: (threadId: string, content: string) => api.post(`/messages/send`, { threadId, content }),
  // Note: Unread mark logic handled via getMessages optionally or distinct route if needed.
};

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────
export const apiInterviews = {
  schedule: (data: object) => api.post('/interviews', data),
  getAll: (params?: object) => api.get('/interviews', { params }),
  getById: (id: string) => api.get(`/interviews/${id}`),
  update: (id: string, data: object) => api.patch(`/interviews/${id}`, data),
  cancel: (id: string, cancelReason?: string) => api.post(`/interviews/${id}/cancel`, { cancelReason }),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const apiNotifications = {
  getAll: (params?: object) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const apiAdmin = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: object) => api.get('/admin/users', { params }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  updateUserRole: (id: string, role: string) => api.patch(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id: string, isActive: boolean) => api.patch(`/admin/users/${id}/status`, { isActive }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getAuditLogs: (params?: object) => api.get('/admin/audit-logs', { params }),
  getSecurityInfo: () => api.get('/admin/security'),
  getAnalytics: (period?: '7d' | '30d' | '90d') => api.get('/admin/analytics', { params: { period } }),
  getJobs: (params?: object) => api.get('/admin/jobs', { params }),
  updateJobStatus: (jobId: string, status: string) => api.patch(`/admin/jobs/${jobId}/status`, { status }),
};

// ─── UPLOAD (direct upload helpers) ──────────────────────────────────────────
export const apiUpload = {
  uploadAvatar: (formData: FormData) =>
    api.post('/upload/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCv: (formData: FormData) =>
    api.post('/upload/cv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Legacy aliases for backward compatibility with existing components
export const apiAI = {
  generateCV: (data: object) => api.post('/ai/cv-builder', data),
  improveCVSection: (section: string, text: string) => api.post('/ai/improve-cv', { section, text }),
  searchCandidates: (query: string, params?: object) => api.get('/ai/search-candidates', { params: { ...params, q: query } }),
  analyzeProfile: (userId: string) => api.post('/ai/analyze-profile', { userId }),
};

// Legacy: some components use apiPipeline directly
export const apiPipeline = {
  getPipeline: (jobId: string) => apiApplications.getPipeline(jobId),
  bulkUpdateStatus: (applicationIds: string[], status: string) => apiApplications.bulkUpdateStatus(applicationIds, status),
  updateStatus: (id: string, status: string, data?: object) => apiApplications.updateStatus(id, status, data),
};