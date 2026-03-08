import axios from "axios";

const BASE_URL = import.meta.env.VITE_CHECKLIST_API_URL;

let onSessionExpired = () => {};
export function setOnSessionExpired(callback: () => void) {
  onSessionExpired = callback;
}

export const advertisementApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

advertisementApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const status = error.response ? error.response.status : null;
    const isUnauthorized = status === 401;
    const isRefreshRequest = originalRequest.url.includes("/auth/refresh");

    if (isUnauthorized && !isRefreshRequest && !originalRequest._retry) {
      try {
        if (originalRequest) originalRequest._retry = true;
        await refreshClient.post("/auth/refresh");
        return advertisementApi(originalRequest);
      } catch (error) {
        if (onSessionExpired) {
          onSessionExpired();
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
