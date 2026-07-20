import { ClipboardList, LogOut } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

export function AppLayout() {
  const navigate = useNavigate();
  const { accessToken, clearSession } = useAuthStore();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/tasks">
          <ClipboardList size={22} aria-hidden="true" />
          <span>Orizon Todo</span>
        </Link>
        {accessToken ? (
          <button className="icon-button" type="button" onClick={handleLogout} aria-label="Log out">
            <LogOut size={18} aria-hidden="true" />
          </button>
        ) : null}
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
