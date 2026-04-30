// src/lib/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// THE MOCK API LAYER.
//
// Right now this returns fake data from mock/data.ts with a small delay
// so the app feels like it is fetching from a real server.
//
// When the real backend is ready:
//   1. Delete all the mock functions below
//   2. Uncomment the axios section at the bottom
//   3. Done — every component keeps working with zero changes
// ─────────────────────────────────────────────────────────────────────────────

import {
  MOCK_JOBS, MOCK_APPLICATIONS, MOCK_CANDIDATES,
  MOCK_ADMIN_STATS, MOCK_AUDIT_LOGS, MOCK_NOTIFICATIONS,
  MOCK_THREADS, MOCK_CANDIDATE_STATS, MOCK_EMPLOYER_STATS,
  MOCK_INTERVIEWS, MOCK_THREAT_DATA, MOCK_USERS,
} from "@/mock/data";

// Simulates network delay so loading states are visible in development
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ── Auth ──────────────────────────────────────────────────────────────────────
export const apiAuth = {

  async login(email: string, password: string, role: string) {
    await delay(800);
    const user = MOCK_USERS.find(
      u => u.email === email && u.password === password && u.role === role
    );
    if (!user) throw new Error("Invalid email or password");
    // Return without password
    const { password: _pw, ...safe } = user;
    return safe;
  },

  async signup(data: { email: string; password: string; firstName: string; lastName: string; role: string }) {
    await delay(1000);
    const exists = MOCK_USERS.find(u => u.email === data.email);
    if (exists) throw new Error("Email already registered");
    return { userId: "new_" + Date.now(), message: "OTP sent to your email" };
  },

  async verifyOtp(userId: string, code: string) {
    await delay(600);
    // Accept any 6-digit code in development
    if (code.length !== 6 || !/^\d+$/.test(code)) throw new Error("Invalid OTP");
    const user = MOCK_USERS.find(u => u.id === userId) ?? MOCK_USERS[0];
    const { password: _pw, ...safe } = user;
    return safe;
  },

  async logout() {
    await delay(200);
    return { success: true };
  },

  async forgotPassword(email: string) {
    await delay(600);
    return { message: "Reset link sent to " + email };
  },
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const apiProfile = {

  async getMe() {
    await delay(300);
    return MOCK_USERS[0];
  },

  async getCandidateStats() {
    await delay(200);
    return MOCK_CANDIDATE_STATS;
  },

  async updateAvailability(isAvailable: boolean) {
    await delay(300);
    return { isAvailable };
  },

  async updateProfile(data: Record<string, unknown>) {
    await delay(500);
    return { ...MOCK_USERS[0].profile, ...data };
  },

  async getUpcomingInterviews() {
    await delay(300);
    return MOCK_INTERVIEWS;
  },
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const apiJobs = {

  async getJobs(filters: Record<string, unknown> = {}) {
    await delay(400);
    let jobs = [...MOCK_JOBS];

    // Apply filters locally so filters feel real
    if (filters.search) {
      const q = (filters.search as string).toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.employer.companyName.toLowerCase().includes(q) ||
        j.skills.some(s => s.toLowerCase().includes(q))
      );
    }
    if (filters.category) {
      jobs = jobs.filter(j => j.category === filters.category);
    }
    if (filters.type) {
      jobs = jobs.filter(j => j.type === filters.type);
    }
    if (filters.mode) {
      jobs = jobs.filter(j => j.mode === filters.mode);
    }
    if (filters.sort === "salary_desc") {
      jobs.sort((a, b) => (b.salaryMax ?? 0) - (a.salaryMax ?? 0));
    } else if (filters.sort === "salary_asc") {
      jobs.sort((a, b) => (a.salaryMin ?? 0) - (b.salaryMin ?? 0));
    } else if (filters.sort === "most_applied") {
      jobs.sort((a, b) => b.applicationCount - a.applicationCount);
    }

    const page  = Number(filters.page  ?? 1);
    const limit = Number(filters.limit ?? 12);
    const start = (page - 1) * limit;

    return {
      jobs:       jobs.slice(start, start + limit),
      pagination: { total: jobs.length, page, limit, totalPages: Math.ceil(jobs.length / limit) },
    };
  },

  async getJobById(id: string) {
    await delay(300);
    const job = MOCK_JOBS.find(j => j.id === id);
    if (!job) throw new Error("Job not found");
    return job;
  },

  async getSavedJobs() {
    await delay(300);
    return MOCK_JOBS.filter(j => j.isSaved);
  },

  async getMyListings() {
    await delay(300);
    return MOCK_JOBS.slice(0, 2).map(j => ({
      ...j,
      employer: { companyName: "TechFlow Inc.", logoUrl: null, isVerified: true },
    }));
  },

  async toggleSave(jobId: string) {
    await delay(200);
    const job = MOCK_JOBS.find(j => j.id === jobId);
    if (job) job.isSaved = !job.isSaved;
    return { saved: job?.isSaved ?? false };
  },

  async apply(jobId: string, coverLetter: string) {
    await delay(800);
    const job = MOCK_JOBS.find(j => j.id === jobId);
    if (job?.hasApplied) throw new Error("Already applied");
    if (job) job.hasApplied = true;
    return { id: "app_new_" + Date.now(), jobId, stage: "APPLIED" };
  },

  async create(data: Record<string, unknown>) {
    await delay(1200);
    const newJob = { ...MOCK_JOBS[0], ...data, id: "job_new_" + Date.now(), createdAt: new Date().toISOString(), applicationCount: 0 };
    return newJob;
  },

  async updateStatus(jobId: string, status: string) {
    await delay(300);
    return { jobId, status };
  },

  async getRecommendations() {
    await delay(500);
    return MOCK_JOBS.slice(0, 4);
  },
};

// ── Applications ──────────────────────────────────────────────────────────────
export const apiApplications = {

  async getMyApplications() {
    await delay(400);
    return MOCK_APPLICATIONS;
  },

  async getJobApplicants(jobId: string) {
    await delay(400);
    return MOCK_CANDIDATES;
  },

  async updateStage(applicationId: string, stage: string) {
    await delay(400);
    const app = MOCK_APPLICATIONS.find(a => a.id === applicationId);
    if (app) {
      app.stage = stage;
      app.timeline.push({
        id:        "t_new_" + Date.now(),
        stage,
        note:      `Moved to ${stage}`,
        changedAt: new Date().toISOString(),
      });
    }
    return { applicationId, stage };
  },
};

// ── AI ────────────────────────────────────────────────────────────────────────
export const apiAI = {

  async search(query: string, filters: Record<string, unknown> = {}) {
    await delay(1500);  // feels like AI is thinking
    return {
      summary: `Found ${MOCK_CANDIDATES.length} candidates matching "${query}". Ranked by skill alignment and availability.`,
      results: MOCK_CANDIDATES,
    };
  },

  async generateCV(notes: string) {
    await delay(2000);  // feels like AI is generating
    return {
      name:    "Ayesha Khan",
      title:   "Full-Stack Developer",
      summary: "Results-driven Full-Stack Developer with 4+ years building scalable SaaS applications using React and Node.js. Known for strong problem-solving skills and cross-functional collaboration.",
      skills:  ["React", "TypeScript", "Node.js", "AWS", "MongoDB", "PostgreSQL"],
      experience: [
        { title: "Senior Frontend Developer", company: "TechSolutions", from: "2021", to: "Present", bullets: ["Led team of 4, shipped dashboard for 50k+ users", "Reduced load time by 40% through code splitting"] },
      ],
      education: [{ degree: "BS Computer Science", school: "LUMS", year: 2020 }],
    };
  },
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const apiMessages = {

  async getThreads() {
    await delay(300);
    return MOCK_THREADS;
  },

  async getThread(threadId: string) {
    await delay(200);
    return MOCK_THREADS.find(t => t.id === threadId);
  },

  async sendMessage(threadId: string, text: string) {
    await delay(300);
    return { id: "m_" + Date.now(), threadId, senderId: "user_candidate_1", text, sentAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isMe: true };
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const apiNotifications = {

  async getAll() {
    await delay(200);
    return MOCK_NOTIFICATIONS;
  },

  async markAllRead() {
    await delay(200);
    MOCK_NOTIFICATIONS.forEach(n => { n.unread = false; });
    return { success: true };
  },
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const apiAdmin = {

  async getStats() {
    await delay(400);
    return MOCK_ADMIN_STATS;
  },

  async getUsers() {
    await delay(400);
    return MOCK_USERS.filter(u => u.role === "CANDIDATE").map(u => ({
      ...u,
      profile: u.profile ? { ...(u.profile as Record<string, unknown>), firstName: "Ayesha", lastName: "Khan" } : null,
    }));
  },

  async getAuditLog() {
    await delay(300);
    return MOCK_AUDIT_LOGS;
  },

  async getThreatData() {
    await delay(300);
    return MOCK_THREAT_DATA;
  },

  async suspendUser(userId: string) {
    await delay(400);
    return { userId, isSuspended: true };
  },

  async verifyUser(userId: string) {
    await delay(400);
    return { userId, isVerified: true };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WHEN REAL BACKEND IS READY — replace this entire file with:
// ─────────────────────────────────────────────────────────────────────────────
//
// import axios from "axios";
//
// const http = axios.create({
//   baseURL:      import.meta.env.VITE_API_URL,
//   withCredentials: true,
// });
//
// http.interceptors.response.use(
//   r => r,
//   async err => {
//     if (err.response?.status === 401 && !err.config._retry) {
//       err.config._retry = true;
//       await http.post("/auth/refresh");
//       return http(err.config);
//     }
//     return Promise.reject(err);
//   }
// );
//
// export const apiAuth = {
//   login:  (email, password, role) => http.post("/auth/login", { email, password, role }).then(r => r.data.data),
//   signup: (data)                  => http.post("/auth/signup", data).then(r => r.data.data),
//   ...
// };
// ─────────────────────────────────────────────────────────────────────────────
