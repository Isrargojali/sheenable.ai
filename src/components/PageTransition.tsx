import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

/** Lightweight fade-in wrapper keyed by pathname — no extra deps. */
export default function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-page-fade">
      {children}
    </div>
  );
}
