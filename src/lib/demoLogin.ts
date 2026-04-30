// Helper to one-click sign in as a demo user.
import { apiAuth } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useNotifStore } from "@/store/notifStore";
import { MOCK_NOTIFICATIONS } from "@/mock/data";

type Role = "CANDIDATE" | "EMPLOYER" | "ADMIN";

const CREDS: Record<Role, { email: string; pass: string; redirect: string }> = {
  CANDIDATE: { email: "ayesha@test.com",    pass: "Test@1234",  redirect: "/candidate/dashboard" },
  EMPLOYER:  { email: "hr@techflow.com",    pass: "Test@1234",  redirect: "/employer/dashboard"  },
  ADMIN:     { email: "admin@SheEnableAI.pk", pass: "Admin@1234", redirect: "/admin/overview"      },
};

export async function demoLogin(role: Role): Promise<string> {
  const c = CREDS[role];
  const user = await apiAuth.login(c.email, c.pass, role);
  useAuthStore.getState().setUser({
    id: user.id, email: user.email, role: user.role as any,
  });
  useNotifStore.getState().setNotifs(MOCK_NOTIFICATIONS as any);
  return c.redirect;
}
