// src/mock/data.ts
// ─────────────────────────────────────────────────────────────────────────────
// ALL fake data for every screen.
// This is the single source of truth while the real API is being built.
// When the real API is ready → delete this file, update lib/api.ts → done.
// ─────────────────────────────────────────────────────────────────────────────

// ── Users ────────────────────────────────────────────────────────────────────
export const MOCK_USERS = [
  {
    id:    "user_candidate_1",
    email: "ayesha@test.com",
    password: "Test@1234",
    role:  "CANDIDATE",
    isVerified: true,
    profile: {
      firstName:    "Ayesha",
      lastName:     "Khan",
      title:        "Full-Stack Developer",
      location:     "Lahore, Pakistan",
      skills:       ["React", "TypeScript", "Node.js", "AWS", "MongoDB"],
      category:     "IT & Tech",
      isAvailable:  true,
      profileScore: 72,
      photoUrl:     null,
      summary:      "Results-driven Full-Stack Developer with 4+ years building scalable SaaS applications.",
      expectedSalary: 90000,
      linkedin:     "https://linkedin.com/in/ayesha-khan",
      portfolio:    "https://ayesha.dev",
    },
  },
  {
    id:    "user_employer_1",
    email: "hr@techflow.com",
    password: "Test@1234",
    role:  "EMPLOYER",
    isVerified: true,
    profile: {
      companyName: "TechFlow Inc.",
      industry:    "Software",
      isVerified:  true,
      logoUrl:     null,
      website:     "https://techflow.com",
      description: "Building next-generation SaaS products.",
    },
  },
  {
    id:    "user_admin_1",
    email: "admin@hercareer.pk",
    password: "Admin@1234",
    role:  "ADMIN",
    isVerified: true,
    profile: null,
  },
  {
    id:    "user_superadmin_1",
    email: "root@hercareer.pk",
    password: "Root@1234",
    role:  "SUPER_ADMIN",
    isVerified: true,
    profile: null,
  },
];

// ── Jobs ─────────────────────────────────────────────────────────────────────
export const MOCK_JOBS = [
  {
    id: "job_1",
    title: "Frontend Developer",
    description: "Build scalable web apps using React + TypeScript. Work with a team of 5 engineers shipping products used by 50k+ users daily. Remote-friendly, async culture.",
    category: "IT & Tech",
    type: "FULLTIME",
    mode: "REMOTE",
    location: "Lahore, Pakistan",
    salaryMin: 80000,
    salaryMax: 110000,
    experienceMin: 2,
    skills: ["React", "TypeScript", "Tailwind CSS", "REST APIs"],
    perks: ["Health insurance", "Remote work", "Annual bonus", "Professional development"],
    status: "ACTIVE",
    isFeatured: true,
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    applicationCount: 24,
    isSaved: false,
    hasApplied: false,
    aiScore: 96,
    employer: {
      companyName: "TechFlow Inc.",
      logoUrl: null,
      isVerified: true,
      website: "https://techflow.com",
    },
  },
  {
    id: "job_2",
    title: "Financial Analyst",
    description: "Corporate finance, forecasting, and modelling for Pakistan's fastest-growing fintech. Work with C-suite to drive data-driven decisions.",
    category: "Finance",
    type: "FULLTIME",
    mode: "HYBRID",
    location: "Karachi, Pakistan",
    salaryMin: 65000,
    salaryMax: 85000,
    experienceMin: 3,
    skills: ["Financial Modelling", "Excel", "Power BI", "CFA preferred"],
    perks: ["Health insurance", "Annual bonus", "Flexible hours"],
    status: "ACTIVE",
    isFeatured: false,
    deadline: new Date(Date.now() + 21 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    applicationCount: 12,
    isSaved: true,
    hasApplied: false,
    aiScore: 91,
    employer: {
      companyName: "Goldman Partners",
      logoUrl: null,
      isVerified: true,
      website: null,
    },
  },
  {
    id: "job_3",
    title: "UX Designer",
    description: "End-to-end UX for our fintech mobile app. Research, wireframe, prototype, and test. You'll own the design system.",
    category: "Design & UX",
    type: "CONTRACT",
    mode: "REMOTE",
    location: null,
    salaryMin: 70000,
    salaryMax: 95000,
    experienceMin: 3,
    skills: ["Figma", "UX Research", "Prototyping", "Design Systems"],
    perks: ["Remote work", "Flexible hours"],
    status: "ACTIVE",
    isFeatured: false,
    deadline: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    applicationCount: 8,
    isSaved: false,
    hasApplied: false,
    aiScore: 88,
    employer: {
      companyName: "DesignCraft",
      logoUrl: null,
      isVerified: false,
      website: null,
    },
  },
  {
    id: "job_4",
    title: "Data Science Intern",
    description: "6-month ML pipeline internship. Work on real production data. Python, pandas, scikit-learn. We hire interns full-time.",
    category: "IT & Tech",
    type: "INTERNSHIP",
    mode: "HYBRID",
    location: "Islamabad, Pakistan",
    salaryMin: 30000,
    salaryMax: 45000,
    experienceMin: 0,
    skills: ["Python", "pandas", "scikit-learn", "SQL"],
    perks: ["Professional development", "Flexible hours"],
    status: "ACTIVE",
    isFeatured: false,
    deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    applicationCount: 41,
    isSaved: false,
    hasApplied: true,
    aiScore: 84,
    employer: {
      companyName: "AI Labs PK",
      logoUrl: null,
      isVerified: true,
      website: null,
    },
  },
  {
    id: "job_5",
    title: "Healthcare Administrator",
    description: "Manage patient records, scheduling, and compliance for a chain of private clinics. Leadership experience preferred.",
    category: "Healthcare",
    type: "FULLTIME",
    mode: "ONSITE",
    location: "Lahore, Pakistan",
    salaryMin: 50000,
    salaryMax: 70000,
    experienceMin: 2,
    skills: ["Healthcare Management", "MS Office", "Communication", "Leadership"],
    perks: ["Health insurance", "Annual bonus"],
    status: "ACTIVE",
    isFeatured: false,
    deadline: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    applicationCount: 5,
    isSaved: false,
    hasApplied: false,
    aiScore: 72,
    employer: {
      companyName: "MedCare Group",
      logoUrl: null,
      isVerified: true,
      website: null,
    },
  },
  {
    id: "job_6",
    title: "Content Marketing Manager",
    description: "Lead content strategy, SEO, and social media for a fast-growing e-commerce brand. You'll manage a team of 3 writers.",
    category: "Sales & Marketing",
    type: "FULLTIME",
    mode: "REMOTE",
    location: null,
    salaryMin: 55000,
    salaryMax: 75000,
    experienceMin: 4,
    skills: ["Content Strategy", "SEO", "Social Media", "Team Leadership"],
    perks: ["Remote work", "Flexible hours", "Performance bonus"],
    status: "ACTIVE",
    isFeatured: false,
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    applicationCount: 19,
    isSaved: true,
    hasApplied: false,
    aiScore: 78,
    employer: {
      companyName: "BrandBoost",
      logoUrl: null,
      isVerified: false,
      website: null,
    },
  },
];

// ── Applications ──────────────────────────────────────────────────────────────
export const MOCK_APPLICATIONS = [
  {
    id: "app_1",
    jobId: "job_1",
    candidateId: "user_candidate_1",
    stage: "INTERVIEW",
    coverLetter: "I am very excited about this opportunity…",
    aiMatchScore: 96,
    appliedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    job: MOCK_JOBS[0],
    timeline: [
      { id: "t1", stage: "APPLIED",    note: "Application submitted",   changedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
      { id: "t2", stage: "SCREENING",  note: "Moved to screening",      changedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: "t3", stage: "INTERVIEW",  note: "Interview scheduled",     changedAt: new Date(Date.now() - 86400000).toISOString() },
    ],
  },
  {
    id: "app_2",
    jobId: "job_3",
    candidateId: "user_candidate_1",
    stage: "SCREENING",
    coverLetter: "",
    aiMatchScore: 88,
    appliedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    job: MOCK_JOBS[2],
    timeline: [
      { id: "t4", stage: "APPLIED",   note: "Application submitted", changedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: "t5", stage: "SCREENING", note: "Under review",          changedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    ],
  },
  {
    id: "app_3",
    jobId: "job_4",
    candidateId: "user_candidate_1",
    stage: "APPLIED",
    coverLetter: "Eager to learn and contribute…",
    aiMatchScore: 84,
    appliedAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    job: MOCK_JOBS[3],
    timeline: [
      { id: "t6", stage: "APPLIED", note: "Application submitted", changedAt: new Date(Date.now() - 86400000).toISOString() },
    ],
  },
];

// ── Candidates (for employer views) ──────────────────────────────────────────
export const MOCK_CANDIDATES = [
  {
    id: "prof_1",
    userId: "u_1",
    firstName: "Aisha",
    lastName: "Khan",
    title: "Frontend Developer",
    location: "Lahore, Pakistan",
    skills: ["React", "TypeScript", "Node.js", "AWS"],
    category: "IT & Tech",
    isAvailable: true,
    profileScore: 92,
    aiMatchScore: 96,
    aiReason: "Perfect React/TS alignment. 4 years senior experience matches requirements.",
    photoUrl: null,
    experience: [{ title: "Senior Frontend Developer", company: "TechSolutions" }],
  },
  {
    id: "prof_2",
    userId: "u_2",
    firstName: "Maria",
    lastName: "Garcia",
    title: "UX Design Lead",
    location: "Remote",
    skills: ["Figma", "UX Research", "Design Systems", "CSS"],
    category: "Design & UX",
    isAvailable: true,
    profileScore: 88,
    aiMatchScore: 94,
    aiReason: "Award-winning UX portfolio. Ex-Google. Strong design systems background.",
    photoUrl: null,
    experience: [{ title: "Senior UX Designer", company: "Google" }],
  },
  {
    id: "prof_3",
    userId: "u_3",
    firstName: "Emily",
    lastName: "Chen",
    title: "Data Analyst",
    location: "Karachi, Pakistan",
    skills: ["Python", "SQL", "Tableau", "Machine Learning"],
    category: "IT & Tech",
    isAvailable: false,
    profileScore: 85,
    aiMatchScore: 88,
    aiReason: "Strong Python + SQL skills. Busy but open to right opportunities.",
    photoUrl: null,
    experience: [{ title: "Data Analyst", company: "FinTech Corp" }],
  },
];

// ── Admin stats ───────────────────────────────────────────────────────────────
export const MOCK_ADMIN_STATS = {
  totalUsers:   12847,
  activeJobs:    3241,
  employers:     1520,
  applications: 28450,
  weeklyGrowth: {
    users:        234,
    jobs:          89,
    employers:     45,
    applications: 1200,
  },
};

// ── Audit log ─────────────────────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS = [
  { id: "a1", action: "LOGIN_SUCCESS",   userId: "Ayesha Khan",    detail: "role=candidate ip=127.0.0.1",                  createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: "a2", action: "SIGNUP",          userId: "Fatima Malik",   detail: "role=candidate otp_pending",                  createdAt: new Date(Date.now() - 11 * 60000).toISOString() },
  { id: "a3", action: "JOB_POSTED",      userId: "TechFlow Inc.",  detail: 'jobId=job_7 title="React Native Dev"',        createdAt: new Date(Date.now() - 33 * 60000).toISOString() },
  { id: "a4", action: "RATE_LIMIT",      userId: "unknown",        detail: "ip=192.168.1.1 endpoint=/api/auth/login",     createdAt: new Date(Date.now() - 42 * 60000).toISOString() },
  { id: "a5", action: "BRUTE_FORCE_BLOCK",userId:"hacker@evil.com",detail: "5 failed attempts, locked 300s",             createdAt: new Date(Date.now() - 78 * 60000).toISOString() },
  { id: "a6", action: "LOGIN_SUCCESS",   userId: "Sara Ahmed",     detail: "role=candidate ip=10.0.0.5",                 createdAt: new Date(Date.now() - 120 * 60000).toISOString() },
  { id: "a7", action: "EMPLOYER_APPROVED",userId:"Admin",          detail: "approved employerId=emp_15 TechCorp",        createdAt: new Date(Date.now() - 180 * 60000).toISOString() },
];

// ── Notifications ─────────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS = [
  { id: "n1", type: "INTERVIEW_INVITE",  title: "Interview Scheduled!",      body: "TechFlow Inc. scheduled an interview for Frontend Developer — Fri Jan 19 at 3:00 PM", unread: true,  icon: "🤝", timestamp: "5 min ago" },
  { id: "n2", type: "APP_UPDATE",        title: "Application Updated",        body: "Your application for UX Designer at DesignCraft moved to Screening",                  unread: true,  icon: "📋", timestamp: "2 hours ago" },
  { id: "n3", type: "JOB_MATCH",         title: "New Job Match Found!",       body: "Your profile is a 94% match for 'React Developer' at StartupXYZ",                    unread: false, icon: "🤖", timestamp: "Yesterday" },
  { id: "n4", type: "MESSAGE_RECEIVED",  title: "Message from TechFlow HR",   body: "Hi Ayesha, we'd love to schedule a quick intro call...",                             unread: false, icon: "💬", timestamp: "2 days ago" },
];

// ── Messages / threads ────────────────────────────────────────────────────────
export const MOCK_THREADS = [
  {
    id: "thread_1",
    with: { id: "u_emp1", name: "TechFlow HR", initials: "TF", color: "from-violet-500 to-violet-800" },
    lastMessage: "Hi! Would you be available for a quick call tomorrow?",
    lastTime: "10:32 AM",
    unread: 2,
    messages: [
      { id: "m1", senderId: "u_emp1", text: "Hi Ayesha! We reviewed your application.", sentAt: "10:15 AM", isMe: false },
      { id: "m2", senderId: "user_candidate_1", text: "Thank you! I am very interested in the role.", sentAt: "10:20 AM", isMe: true },
      { id: "m3", senderId: "u_emp1", text: "Great! Would you be available for a quick call tomorrow?", sentAt: "10:32 AM", isMe: false },
    ],
  },
  {
    id: "thread_2",
    with: { id: "u_emp2", name: "Goldman Partners", initials: "GP", color: "from-emerald-500 to-emerald-800" },
    lastMessage: "We have reviewed your CV and are impressed.",
    lastTime: "Yesterday",
    unread: 0,
    messages: [
      { id: "m4", senderId: "u_emp2", text: "Hello, we have reviewed your CV and are impressed.", sentAt: "Yesterday 3:00 PM", isMe: false },
    ],
  },
];

// ── Candidate dashboard stats ─────────────────────────────────────────────────
export const MOCK_CANDIDATE_STATS = {
  profileViews:   284,
  jobMatches:      47,
  applications:    12,
  certifications:   5,
  profileScore:    72,
};

// ── Interviews ────────────────────────────────────────────────────────────────
export const MOCK_INTERVIEWS = [
  { id: "i1", company: "TechSolutions",  role: "React Developer",    date: "Fri Jan 19", time: "3:00 PM",  format: "VIDEO",  status: "CONFIRMED" },
  { id: "i2", company: "DesignStudio",   role: "UX Design Lead",     date: "Mon Jan 22", time: "11:00 AM", format: "ONSITE", status: "PENDING"   },
];

// ── Employer stats ────────────────────────────────────────────────────────────
export const MOCK_EMPLOYER_STATS = {
  activeJobs:      8,
  totalApplicants: 156,
  interviews:      23,
  aiMatches:       42,
};

// ── Super admin threat data ───────────────────────────────────────────────────
export const MOCK_THREAT_DATA = {
  threatLevel:    "LOW",
  uptime:         "99.97%",
  apiP95:         "94ms",
  activeSessions: 847,
  blockedIPs:     2,
  failedLogins24h:12,
  bruteBlocks24h: 2,
  rateLimitHits:  4,
  xssAttempts:    0,
};
