import axios from "axios";

let csrfToken = "";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  withCredentials: true,
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
  return "";
}

api.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  if (!["get", "head", "options", "trace"].includes(method)) {
    config.headers["X-CSRFToken"] = csrfToken || getCookie("csrftoken");
  }
  return config;
});

export async function initialiseCsrf() {
  const response = await api.get("/api/accounts/csrf/");
  csrfToken = response.data.csrfToken || "";
}
export default api;
