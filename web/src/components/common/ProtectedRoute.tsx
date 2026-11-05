import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** Renders the child route only for a validated session. */
export default function ProtectedRoute() {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div className="p-6 text-center">Checking your session…</div>;
  }

  if (!isAuthenticated) {
    // Preserve the destination so login can send the user back.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
