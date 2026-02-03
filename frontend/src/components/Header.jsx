import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    // Only call fetchUser if a token exists. Avoid calling /auth/me repeatedly
    // when there's no token (which triggers 401 responses).
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    if (token) fetchUser();

    // refresh when token changes in another tab (storage event) or same tab (authChange)
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "access_token") {
        const t =
          localStorage.getItem("token") || localStorage.getItem("access_token");
        if (t) fetchUser();
        else setUser(null);
      }
    };
    const onAuthChange = () => {
      const t =
        localStorage.getItem("token") || localStorage.getItem("access_token");
      if (t) fetchUser();
      else setUser(null);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("authChange", onAuthChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChange", onAuthChange);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    // notify header and other listeners
    window.dispatchEvent(new Event("authChange"));
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="site-header">
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="brand">
          <Link to="/" className="brand-link">
            <div className="brand-title">Blog App</div>
            <div className="brand-sub">Manage posts, explore ideas</div>
          </Link>
        </div>
        <nav>
          {user ? (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span>Hi, {user.username}</span>
              <button
                className="small-btn"
                onClick={logout}
                style={{ background: "#ef4444" }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <Link to="/login">Sign in</Link>
              <Link to="/register">Sign up</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
