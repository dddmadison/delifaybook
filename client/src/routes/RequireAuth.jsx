// client/src/routes/RequireAuth.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { isLoading, isAuthed, status } = useAuth();
  const location = useLocation();

  // 개발에서만 로그
  if (process.env.NODE_ENV !== "production") {
    console.log("[RequireAuth]", {
      isLoading,
      isAuthed,
      status,
      path: location.pathname,
    });
  }

  // Auth 준비 전에는 아무것도 렌더하지 않음 (AppLayout도 아직 안 뜸)
  if (isLoading) return null;

  // 서버가 죽었거나 기타 에러면, 일단 로그인 화면으로 보내지 말고 최소 표시
  if (status === "error") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>
          인증 확인 중 오류가 발생했어요.
        </div>
        <div>서버 상태(/api/me) 또는 네트워크를 확인해줘.</div>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ redirectTo: location.pathname }}
      />
    );
  }

  // children 패턴 + Outlet 패턴 둘 다 지원
  return children ? children : <Outlet />;
}
