import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { refreshAccessToken } from "../services/auth";
import { useAuthStore } from "../store/authStore";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isRestoring, setIsRestoring] = useState(!accessToken);

  useEffect(() => {
    if (accessToken) {
      setIsRestoring(false);
      return;
    }

    let isMounted = true;

    refreshAccessToken()
      .then(({ access }) => {
        if (isMounted) {
          setAccessToken(access);
        }
      })
      .catch(() => {
        if (isMounted) {
          clearSession();
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRestoring(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, clearSession, setAccessToken]);

  if (isRestoring) {
    return <p className="muted">Restoring session...</p>;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
