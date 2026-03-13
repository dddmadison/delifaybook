// client/src/api/client.js
import axios from "axios";

const apiClient = axios.create({
  withCredentials: true,
});

function isApiResponse(payload) {
  return (
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(payload, "success") &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  );
}

// 401/403 전역 처리 이벤트 (중복 폭주 방지)
let unauthorizedEmitted = false;
function emitUnauthorizedOnce(detail) {
  if (unauthorizedEmitted) return;
  unauthorizedEmitted = true;

  try {
    window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail }));
  } catch {
    // ignore
  }

  setTimeout(() => {
    unauthorizedEmitted = false;
  }, 1500);
}

// ✅ /api/me(부팅 체크)는 “세션만료 이벤트”로 취급하면 안 됨
function shouldIgnoreUnauthorized(url) {
  const u = String(url || "");
  return u.includes("/api/me");
}

apiClient.interceptors.response.use(
  (response) => {
    const p = response.data;

    if (!isApiResponse(p)) return response;

    if (p.success) {
      response.data = p.data;
      return response;
    }

    const err = new Error(p.message || "Request failed");
    err.code = p.code || "API_ERROR";
    err.status = response.status;
    err.path = p.path;
    err.payload = p;
    err.url = response?.config?.url || null;

    if (
      (err.status === 401 || err.status === 403 || err.code === "AUTH_REQUIRED") &&
      !shouldIgnoreUnauthorized(err.url)
    ) {
      emitUnauthorizedOnce({ status: err.status, code: err.code, path: err.path, url: err.url });
    }

    return Promise.reject(err);
  },
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || null;

    const p = error?.response?.data;
    if (p && typeof p === "object" && p.success === false) {
      const err = new Error(p.message || error.message || "Request failed");
      err.code = p.code || "API_ERROR";
      err.status = status;
      err.path = p.path;
      err.payload = p;
      err.url = url;

      if (
        (err.status === 401 || err.status === 403 || err.code === "AUTH_REQUIRED") &&
        !shouldIgnoreUnauthorized(err.url)
      ) {
        emitUnauthorizedOnce({ status: err.status, code: err.code, path: err.path, url: err.url });
      }

      return Promise.reject(err);
    }

    if ((status === 401 || status === 403) && !shouldIgnoreUnauthorized(url)) {
      emitUnauthorizedOnce({ status, code: null, path: null, url });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
