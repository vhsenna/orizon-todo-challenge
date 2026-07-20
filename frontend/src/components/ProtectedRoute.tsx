import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { refreshAccessToken } from "../services/auth";
import { useAuthStore } from "../store/authStore";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isRestoring, setIsRestoring] = useState(Boolean(refreshToken && !accessToken));

  useEffect(() => {
    if (accessToken || !refreshToken) {
      setIsRestoring(false);
      return;
    }

    let isMounted = true;

    refreshAccessToken(refreshToken)
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
  }, [accessToken, clearSession, refreshToken, setAccessToken]);

  if (isRestoring) {
    return <p className="muted">Restoring session...</p>;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
