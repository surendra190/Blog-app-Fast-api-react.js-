import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4500",
});

// Attach token from either `token` or `access_token` (some backends return access_token)
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response handler: redirect to login on 401 (unauthorized)
// Keep default behavior: let callers handle 401 so components (like Header)
// can decide what to do. Avoid automatic redirects here which can cause
// navigation loops and repeated requests.
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
