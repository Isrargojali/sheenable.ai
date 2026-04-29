import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls window to top on every route change for a smoother flow. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}
