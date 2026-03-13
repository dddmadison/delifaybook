import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function isValidEmail(v) {
  const s = String(v || "").trim();
  return s.includes("@") && s.includes(".") && s.length >= 5;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [pwError, setPwError] = useState("");
  const [commonError, setCommonError] = useState("");

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length >= 8 && !submitting;
  }, [email, password, submitting]);

  useEffect(() => {
    if (isAuthed) {
      navigate("/bookshelf", { replace: true });
    }
  }, [isAuthed, navigate]);

  const validate = () => {
    let valid = true;
    setEmailError("");
    setPwError("");
    setCommonError("");

    if (!isValidEmail(email)) {
      setEmailError("이메일 형식이 올바르지 않습니다.");
      valid = false;
    }
    if (password.length < 8) {
      setPwError("비밀번호는 최소 8자 이상이어야 합니다.");
      valid = false;
    }
    return valid;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await apiClient.post("/api/auth/register", {
        email: email.trim(),
        password: password,
        nickname: nickname.trim() || null,
      });

      // 가입 성공 -> 로그인 페이지로 이동 (이메일 자동 입력용 state 전달)
      navigate("/login", { state: { email: email } });
      
    } catch (err) {
      const code = err?.code || err?.response?.data?.code;
      if (code === "DUP_EMAIL") {
        setEmailError("이미 사용 중인 이메일입니다.");
      } else {
        setCommonError(err?.message || "가입 처리에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="authPage">
      <div className="authCard">
        {/* 뒤로가기 링크 */}
        <Link className="authBackLink" to="/login">
          ← 로그인으로 돌아가기
        </Link>

        {/* 브랜드 영역 */}
        <div className="authBrand">
          <div className="authLogo">D</div>
          <h1 className="authTitle">회원가입</h1>
          <p className="authSub">DelifayBooks에 오신 것을 환영합니다</p>
        </div>

        {/* 폼 영역 */}
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
            <div className="authError">{emailError}</div>
          </div>

          <div className="authField">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              className="authInput"
              type="password"
              autoComplete="new-password"
              placeholder="최소 8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
            <div className="authError">{pwError}</div>
          </div>

          <div className="authField">
            <label htmlFor="nickname">닉네임 (선택)</label>
            <input
              id="nickname"
              className="authInput"
              type="text"
              autoComplete="nickname"
              placeholder="별명을 입력하세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="authActions">
            <button className="authButton" type="submit" disabled={!canSubmit}>
              {submitting ? "가입 처리 중..." : "가입하기"}
            </button>
            <div className="authError" style={{ textAlign: "center", marginTop: 12 }}>
              {commonError}
            </div>
          </div>
        </form>

        <div className="authLinkRow">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </div>

        <div className="authFooter">© 2025 DelifayBooks</div>
      </div>
    </div>
  );
}