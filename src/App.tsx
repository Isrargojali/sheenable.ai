// src/App.tsx
import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useAuthStore } from "@/store/authStore";
import ScrollToTop from "@/components/ScrollToTop";
import PageTransition from "@/components/PageTransition";

// Auth
import LoginPage    from "@/pages/auth/LoginPage";
import SignupPage   from "@/pages/auth/SignupPage";
import VerifyOtpPage from "@/pages/auth/VerifyOtpPage";

// Landing
import LandingPage from "@/pages/LandingPage";

// Candidate
import CandidateDashboard from "@/pages/candidate/CandidateDashboard";
import JobsBrowsePage     from "@/pages/candidate/JobsBrowsePage";
import ApplicationsPage   from "@/pages/candidate/ApplicationsPage";
import ProfilePage        from "@/pages/candidate/ProfilePage";
import CVBuilderPage      from "@/pages/candidate/CVBuilderPage";
import MessagesPage       from "@/pages/candidate/MessagesPage";

// Employer
import EmployerDashboard from "@/pages/employer/EmployerDashboard";
import PostJobPage       from "@/pages/employer/PostJobPage";
import ListingsPage      from "@/pages/employer/ListingsPage";
import AISearchPage      from "@/pages/employer/AISearchPage";
import ATSPipelinePage   from "@/pages/employer/ATSPipelinePage";

// Admin
import AdminDashboard     from "@/pages/admin/AdminDashboard";
import UsersPage          from "@/pages/admin/UsersPage";
import SecurityCenterPage from "@/pages/admin/SecurityCenterPage";
import AuditLogPage       from "@/pages/admin/AuditLogPage";

// Super Admin
import SuperAdminDashboard from "@/pages/superadmin/SuperAdminDashboard";
import ManageAdminsPage    from "@/pages/superadmin/ManageAdminsPage";
import ThreatMonitorPage   from "@/pages/superadmin/ThreatMonitorPage";

import NotFound from "@/pages/NotFound";

function Guard({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

function RoleHome() {
  const { user } = useAuthStore();
  const map: Record<string, string> = {
    CANDIDATE:   "/candidate/dashboard",
    EMPLOYER:    "/employer/dashboard",
    ADMIN:       "/admin/overview",
    SUPER_ADMIN: "/super-admin/overview",
  };
  return <Navigate to={map[user?.role ?? "CANDIDATE"] ?? "/"} replace />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <div className="text-center max-w-sm">
      <div className="text-5xl mb-4">🔒</div>
      <h1 className="font-serif text-2xl text-foreground mb-2">Access Denied</h1>
      <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <PageTransition>
        <Routes>
          {/* Public */}
          <Route path="/"            element={<LandingPage />} />
          <Route path="/auth/login"  element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/auth/verify" element={<VerifyOtpPage />} />
          <Route path="/home"        element={<RoleHome />} />

          {/* Candidate */}
          <Route path="/candidate/dashboard"    element={<Guard roles={["CANDIDATE"]}><CandidateDashboard /></Guard>} />
          <Route path="/candidate/jobs"         element={<Guard roles={["CANDIDATE"]}><JobsBrowsePage /></Guard>} />
          <Route path="/candidate/applications" element={<Guard roles={["CANDIDATE"]}><ApplicationsPage /></Guard>} />
          <Route path="/candidate/profile"      element={<Guard roles={["CANDIDATE"]}><ProfilePage /></Guard>} />
          <Route path="/candidate/cv"           element={<Guard roles={["CANDIDATE"]}><CVBuilderPage /></Guard>} />
          <Route path="/candidate/messages"     element={<Guard roles={["CANDIDATE"]}><MessagesPage /></Guard>} />

          {/* Employer */}
          <Route path="/employer/dashboard" element={<Guard roles={["EMPLOYER"]}><EmployerDashboard /></Guard>} />
          <Route path="/employer/post-job"  element={<Guard roles={["EMPLOYER"]}><PostJobPage /></Guard>} />
          <Route path="/employer/listings"  element={<Guard roles={["EMPLOYER"]}><ListingsPage /></Guard>} />
          <Route path="/employer/ai-search" element={<Guard roles={["EMPLOYER"]}><AISearchPage /></Guard>} />
          <Route path="/employer/pipeline"  element={<Guard roles={["EMPLOYER"]}><ATSPipelinePage /></Guard>} />

          {/* Admin */}
          <Route path="/admin/overview" element={<Guard roles={["ADMIN","SUPER_ADMIN"]}><AdminDashboard /></Guard>} />
          <Route path="/admin/users"    element={<Guard roles={["ADMIN","SUPER_ADMIN"]}><UsersPage /></Guard>} />
          <Route path="/admin/security" element={<Guard roles={["ADMIN","SUPER_ADMIN"]}><SecurityCenterPage /></Guard>} />
          <Route path="/admin/audit"    element={<Guard roles={["ADMIN","SUPER_ADMIN"]}><AuditLogPage /></Guard>} />

          {/* Super Admin */}
          <Route path="/super-admin/overview"      element={<Guard roles={["SUPER_ADMIN"]}><SuperAdminDashboard /></Guard>} />
          <Route path="/super-admin/manage-admins" element={<Guard roles={["SUPER_ADMIN"]}><ManageAdminsPage /></Guard>} />
          <Route path="/super-admin/threat-monitor"element={<Guard roles={["SUPER_ADMIN"]}><ThreatMonitorPage /></Guard>} />

          {/* Fallbacks */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </PageTransition>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
