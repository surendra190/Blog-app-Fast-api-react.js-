import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import React from "react";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    try {
      setLoading(true);
      await api.post("/auth/register", form);
      // after successful register, go to login
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={submit}>
        <h2>Create account</h2>
        {error && <div className="auth-error">{error}</div>}
        <label>
          Username
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Your name"
          />
        </label>
        <label>
          Email
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@domain.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Choose a password"
          />
        </label>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
    </div>
  );
}
