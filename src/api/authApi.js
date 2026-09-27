import { apiRequest } from "./apiClient";

export function getCsrfRequest() {
  return apiRequest("/api/auth/csrf", {
    method: "GET",
  });
}

export function loginRequest({ username, password }) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
    }),
  });
}

export function getCurrentUserRequest() {
  return apiRequest("/api/auth/me", {
    method: "GET",
  });
}

export function logoutRequest() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}
