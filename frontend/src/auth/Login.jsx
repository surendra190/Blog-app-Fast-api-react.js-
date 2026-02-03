import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import React from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    try {
      setLoading(true);
      const res = await api.post("/auth/login", null, {
        params: { email, password },
      });
      localStorage.setItem("token", res.data.access_token);
      // notify other parts of the app (Header) that auth changed, then navigate
      window.dispatchEvent(new Event("authChange"));
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={submit}>
        <h2>Login</h2>
        {error && <div className="auth-error">{error}</div>}
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />
        </label>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
