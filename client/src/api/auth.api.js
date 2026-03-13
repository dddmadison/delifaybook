// client/src/api/auth.api.js
import apiClient from "./client";

export function unwrapAxios(res) {
  return res && typeof res === "object" && "data" in res ? res.data : res;
}

export function unwrapApiResponse(payload) {
  const v = payload;
  const isObj = v && typeof v === "object" && !Array.isArray(v);
  if (isObj && "success" in v && "data" in v) return v.data;
  return v;
}

export function isProfile(v) {
  return v && typeof v === "object" && v.id != null;
}

export function getHttpStatus(e) {
  return (
    e?.status ??
    e?.response?.status ??
    e?.payload?.status ??
    e?.payload?.httpStatus ??
    null
  );
}

export function getErrorCode(e) {
  return e?.code ?? e?.payload?.code ?? e?.response?.data?.code ?? null;
}

export async function fetchMe() {
  const res = await apiClient.get("/api/me");
  const a = unwrapAxios(res);
  const b = unwrapApiResponse(a);
  return isProfile(b) ? b : null;
}

export async function login(email, password) {
  return apiClient.post("/api/auth/login", { email, password });
}

export async function logout() {
  return apiClient.post("/api/auth/logout");
}
