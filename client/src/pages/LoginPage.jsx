import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function isValidEmail(v) {
  const s = String(v || "").trim();
  return s.includes("@") && s.includes(".") && s.length >= 5;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthed } = useAuth();

  const redirectTo =
    location?.state?.redirectTo ||
    location?.state?.from?.pathname ||
    "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length > 0 && !submitting;
  }, [email, password, submitting]);

  // 회원가입 후 넘어왔을 때 이메일 자동 입력
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  useEffect(() => {
    if (isAuthed) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthed, navigate, redirectTo]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const trimEmail = email.trim();
    if (!isValidEmail(trimEmail)) {
      setErrorMsg("이메일 형식이 올바르지 않습니다.");
      return;
    }
    if (!password) {
      setErrorMsg("비밀번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await login(trimEmail, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const code = err?.code || err?.response?.data?.code;
      if (code === "AUTH_FAILED") {
        setErrorMsg("이메일 또는 비밀번호가 잘못되었습니다.");
      } else {
        setErrorMsg(err?.message || "로그인에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        {/* Header / Brand */}
        <div className="authBrand">
          <div className="authLogo">D</div>
          <h1 className="authTitle">로그인</h1>
          <p className="authSub">나만의 독서 기록을 시작하세요</p>
        </div>

        {/* Form */}
        <form className="authForm" onSubmit={onSubmit}>
          <div className="authField">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              className="authInput"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="authField">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              className="authInput"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="authActions">
            <button className="authButton" type="submit" disabled={!canSubmit}>
              {submitting ? "로그인 중..." : "로그인"}
            </button>
            
            {/* 에러 메시지 */}
            <div className="authError" style={{ textAlign: "center", marginTop: 12 }}>
              {errorMsg}
            </div>
          </div>
        </form>

        {/* Footer Link */}
        <div className="authLinkRow">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </div>

        <div className="authFooter">© 2025 DelifayBooks</div>
      </div>
    </div>
  );
}