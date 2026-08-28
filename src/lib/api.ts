import axios, { type AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

const getApiBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  if (typeof window !== 'undefined' && window.location.hostname) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      envUrl = envUrl.replace('localhost', window.location.hostname).replace('127.0.0.1', window.location.hostname);
    }
  }
  return envUrl;
};

const BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

// ─── HELPER — unwrap standard { data: { data: T } } envelope ─────────────────
const unwrap = <T>(res: AxiosResponse<{ data: T } | T>): T => {
  const body = res.data as Record<string, unknown>;
  return (body?.data ?? body) as T;
};

// ─── Suppress Chrome-extension "Receiving end does not exist" noise ───────────
interface ChromeWindow extends Window {
  chrome?: {
    runtime?: {
      onMessage?: {
        addListener?: (cb: () => void) => void;
      };
    };
  };
}

if (typeof window !== 'undefined') {
  (window as ChromeWindow).chrome?.runtime?.onMessage?.addListener?.(() => {
    // intentionally empty — prevents uncaught extension errors
  });
}

// ─── REQUEST INTERCEPTOR — attach JWT from authStore ─────────────────────────
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
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

    if (
      error.response?.status === 401 &&
      !original._retry &&
      original.url !== '/auth/login' &&
      original.url !== '/auth/refresh-token'
    ) {
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
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true },
        );
        const payload = data as Record<string, Record<string, string>>;
        const newToken = payload.data?.token || (data as Record<string, string>).token;
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
  },
);

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const apiAuth = {
  login:          (email: string, password: string, role?: string) => api.post('/auth/login', { email, password, role }),
  register:       (data: object)                                   => api.post('/auth/register', data),
  verifyOTP:      (userId: string, code: string)                   => api.post('/auth/verify-otp', { userId, code }),
  resendOTP:      (userId: string)                                 => api.post('/auth/resend-otp', { userId }),
  logout:         ()                                               => api.post('/auth/logout'),
  forgotPassword: (email: string)                                  => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token: string, newPassword: string)             => api.post('/auth/reset-password', { token, newPassword }),
  getMe:          ()                                               => api.get('/auth/me').then(unwrap),
  refresh:        ()                                               => api.post('/auth/refresh-token'),
  googleOAuth:   (token?: string, isSimulation?: boolean, simulationData?: object, role?: string) => api.post('/auth/oauth/google', { token, isSimulation, simulationData, role }),
  linkedinOAuth: (code?: string, isSimulation?: boolean, simulationData?: object, role?: string) => api.post('/auth/oauth/linkedin', { code, isSimulation, simulationData, role }),
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export const apiProfile = {
  getMe:                  ()                     => api.get('/profile/me').then(unwrap),
  updateMe:               (data: object)         => api.put('/profile/me', data).then(unwrap),
  getCandidateStats:      ()                     => api.get('/profile/candidate-stats').then(unwrap),
  getEmployerStats:       ()                     => api.get('/profile/employer-stats').then(unwrap),
  getUpcomingInterviews:  ()                     => api.get('/interviews', { params: { upcoming: 'true' } }).then(unwrap),
  getCandidateProfile:    (id: string)           => api.get(`/profile/candidate/${id}`).then(unwrap),
  updateCandidateProfile: (data: object)         => api.put('/profile/me', data).then(unwrap),
  getEmployerProfile:     (id: string)           => api.get(`/profile/employer/${id}`).then(unwrap),
  updateEmployerProfile:  (data: object)         => api.put('/profile/me', data).then(unwrap),
  toggleAvailability:     (isAvailable: boolean) => api.put('/profile/me', { isAvailable }).then(unwrap),
  uploadAvatar:           (formData: FormData)   => api.post('/upload/avatar', formData).then(unwrap),
  getCv:                  ()                     => api.get('/profile/cv').then(unwrap),
  saveCv:                 (data: object)         => api.post('/profile/cv', data).then(unwrap),
  updateProfile:          (data: object)         => api.put('/profile/me', data).then(unwrap),
};

// ─── JOBS ─────────────────────────────────────────────────────────────────────
export const apiJobs = {
  getJobs:            (params?: object)          => api.get('/jobs', { params }).then(unwrap),
  getJobById:         (id: string)               => api.get(`/jobs/${id}`).then(unwrap),
  postJob:            (data: object)             => api.post('/jobs', data).then(unwrap),
  updateJob:          (id: string, data: object) => api.put(`/jobs/${id}`, data).then(unwrap),
  deleteJob:          (id: string)               => api.delete(`/jobs/${id}`).then(unwrap),
  getMyListings:      (params?: object)          => api.get('/jobs/me', { params }).then(unwrap),
  saveJob:            (id: string)               => api.post(`/jobs/${id}/save`).then(unwrap),
  getSavedJobs:       ()                         => api.get('/jobs/saved').then(unwrap),
  getRecommendations: ()                         => api.get('/jobs/recommended').then(unwrap),
};

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
export const apiApplications = {
  apply:              (jobId: string, data: object)               => api.post(`/applications/${jobId}/apply`, data).then(unwrap),
  getApplications:    (params?: object)                           => api.get('/applications/me', { params }).then(unwrap),
  getJobApplications: (jobId: string, params?: object)            => api.get(`/applications/job/${jobId}`, { params }).then(unwrap),
  updateStatus:       (id: string, status: string, data?: object) => api.patch(`/applications/${id}/status`, { status, ...data }).then(unwrap),
  getPipeline:        (jobId: string)                             => api.get(`/applications/job/${jobId}/pipeline`).then(unwrap),
  bulkUpdateStatus:   (applicationIds: string[], status: string)  => api.patch('/applications/bulk-status', { applicationIds, status }).then(unwrap),
  acceptInterview:    (id: string)                                => api.post(`/applications/${id}/accept-interview`).then(unwrap),
  acceptOffer:        (id: string)                                => api.post(`/applications/${id}/accept-offer`).then(unwrap),
};

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
export const apiMessages = {
  getThreads:  ()                                                                        => api.get('/messages/threads').then(unwrap),
  getThread:   (threadId: string)                                                        => api.get(`/messages/threads/${threadId}`).then(unwrap),
  getMessages: (threadId: string, params?: object)                                       => api.get(`/messages/threads/${threadId}/messages`, { params }).then(unwrap),
  sendMessage: (threadId: string, content: string)                                       => api.post('/messages/send', { threadId, content }).then(unwrap),
  startThread: (data: { recipientId: string; jobId?: string; initialMessage?: string }) => api.post('/messages/send', { receiverId: data.recipientId, jobId: data.jobId, content: data.initialMessage }).then(unwrap),
};

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────
export const apiInterviews = {
  schedule: (data: object)                      => api.post('/interviews', data).then(unwrap),
  getAll:   (params?: object)                   => api.get('/interviews', { params }).then(unwrap),
  getById:  (id: string)                        => api.get(`/interviews/${id}`).then(unwrap),
  update:   (id: string, data: object)          => api.patch(`/interviews/${id}`, data).then(unwrap),
  cancel:   (id: string, cancelReason?: string) => api.post(`/interviews/${id}/cancel`, { cancelReason }).then(unwrap),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const apiNotifications = {
  getAll:      (params?: object) => api.get('/notifications', { params }).then(unwrap),
  markRead:    (id: string)      => api.patch(`/notifications/${id}/read`).then(unwrap),
  markAllRead: ()                => api.patch('/notifications/read-all').then(unwrap),
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const apiAdmin = {
  getStats:         ()                               => api.get('/admin/stats').then(unwrap),
  getUsers:         (params?: object)                => api.get('/admin/users', { params }).then(unwrap),
  getUserById:      (id: string)                     => api.get(`/admin/users/${id}`).then(unwrap),
  createAdminUser:  (data: object)                   => api.post('/admin/users', data).then(unwrap),
  updateUserRole:   (id: string, role: string)       => api.patch(`/admin/users/${id}/role`, { role }).then(unwrap),
  updateUserStatus: (id: string, data: { isActive?: boolean; isVerified?: boolean }) => api.patch(`/admin/users/${id}/status`, data).then(unwrap),
  deleteUser:       (id: string)                     => api.delete(`/admin/users/${id}`).then(unwrap),
  getAuditLogs:     (params?: object)                => api.get('/admin/audit-logs', { params }).then(unwrap),
  getSecurityInfo:  ()                               => api.get('/admin/security').then(unwrap),
  getThreatData:    ()                               => api.get('/admin/security-threats').then(unwrap),
  getSystemHealth:  ()                               => api.get('/admin/system-health').then(unwrap),
  getAnalytics:     (period?: 'today' | '7d' | '30d' | '90d') => api.get('/admin/analytics', { params: { period } }).then(unwrap),
  getTimeseries:    (range?: 'today' | '7d' | '30d') => api.get('/admin/stats/timeseries', { params: { range } }).then(unwrap),
  getJobs:          (params?: object)                => api.get('/admin/jobs', { params }).then(unwrap),
  updateJobStatus:  (jobId: string, status: string)  => api.patch(`/admin/jobs/${jobId}/status`, { status }).then(unwrap),
};

// ─── UPLOAD ───────────────────────────────────────────────────────────────────
export const apiUpload = {
  uploadAvatar: (formData: FormData) => api.post('/upload/avatar', formData).then(unwrap),
  uploadCv:     (formData: FormData) => api.post('/upload/cv', formData).then(unwrap),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const apiAI = {
  generateCV:       (data: object)                   => api.post('/ai/cv-builder', data).then(unwrap),
  improveCVSection: (section: string, text: string)  => api.post('/ai/improve-cv', { section, text }).then(unwrap),
  searchCandidates: (query: string, params?: object) => api.get('/ai/search-candidates', { params: { ...params, q: query } }).then(unwrap),
  getMatchedCandidates: ()                           => api.get('/ai/matched-candidates').then(unwrap),
  analyzeProfile:   (userId: string)                 => api.post('/ai/analyze-profile', { userId }).then(unwrap),
  improveJob:       (title: string, description: string) => api.post('/ai/improve-job', { title, description }).then(unwrap),
};

// ─── PIPELINE (legacy alias) ──────────────────────────────────────────────────
export const apiPipeline = {
  getPipeline:      (jobId: string)                           => apiApplications.getPipeline(jobId),
  bulkUpdateStatus: (applicationIds: string[], status: string) => apiApplications.bulkUpdateStatus(applicationIds, status),
  updateStatus:     (id: string, status: string, data?: object) => apiApplications.updateStatus(id, status, data),
};

// ─── CONTACT ──────────────────────────────────────────────────────────────────
export const apiContact = {
  send: (data: { name: string; email: string; role?: string; message: string }) =>
    api.post<{ success: boolean; message: string }>('/contact', data).then(unwrap),
};


