/**
 * AdminProtectRoute.jsx
 *
 * Guards admin-only routes.
 *
 * Checks:
 *  1. adminToken exists in localStorage
 *  2. The JWT is not expired (decoded client-side — no secret needed,
 *     just reading the exp claim from the payload)
 *
 * On failure: clears stale admin storage and redirects to /login.
 */

import { Navigate, useLocation } from "react-router-dom";

// Decode a JWT payload without verifying the signature.
// We only use this to read the exp claim — the backend still verifies
// the signature on every authenticated API call.
function decodeJwtPayload(token) {
  try {
    const base64Payload = token.split(".")[1];
    // atob needs standard base64; JWT uses base64url (replace - and _)
    const base64 = base64Payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function isAdminTokenValid() {
  const token = localStorage.getItem("adminToken");
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  // exp is in seconds; Date.now() is in milliseconds
  if (!payload.exp || Date.now() >= payload.exp * 1000) {
    // Token expired — clean up
    clearAdminSession();
    return false;
  }

  // Ensure it's actually an admin token (role check)
  if (payload.role !== "admin") {
    clearAdminSession();
    return false;
  }

  return true;
}

export function clearAdminSession() {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminSession");
  localStorage.removeItem("adminInfo");
  sessionStorage.removeItem("adminSession");
  sessionStorage.removeItem("adminInfo");
}

export default function AdminProtectRoute({ children }) {
  const location = useLocation();

  if (!isAdminTokenValid()) {
    // Clear any stale values so they can't be reused
    clearAdminSession();
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
