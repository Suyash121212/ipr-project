/**
 * ProtectRoute.jsx
 *
 * Guards Clerk-authenticated user routes (/dashboard, /patent, etc.).
 * Admin routes use AdminProtectRoute instead — do NOT mix them.
 */

import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectRoute = ({ children }) => {
  const location = useLocation();

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/login" state={{ from: location.pathname }} replace />
      </SignedOut>
    </>
  );
};

export default ProtectRoute;
