// BookDetail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressEditor } from "../components/ProgressEditor.jsx"; // 슬라이더+퀵칩 컴포넌트

export default function BookDetail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("진행중");
  const [progress, setProgress] = useState({ current: 120, total: 300 });
  const [tags, setTags] = useState(["개발", "자바", "디자인패턴"]);

  // current 변경 헬퍼 (0~total 클램프)
  const setCurrent = (nextOrUpdater) =>
    setProgress((p) => {
      const next = typeof nextOrUpdater === "function" ? nextOrUpdater(p.current) : nextOrUpdater;
      const cur = Math.max(0, Math.min(next, p.total));
      return { ...p, current: cur };
    });

  // +N쪽 / -N쪽 (0~total 클램프)
  const addPages = (n) =>
    setProgress((p) => {
      const cur = Math.max(0, Math.min(p.current + n, p.total));
      return { ...p, current: cur };
    });

  // current/total 변화에 따라 상태 자동 보정
  useEffect(() => {
    if (progress.current >= progress.total && status !== "완독") setStatus("완독");
    if (progress.current === 0 && status === "완독") setStatus("안읽음");
  }, [progress.current, progress.total, status]);

  const chip = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 8,
    background: "#f2f4f7",
    marginRight: 6,
    fontSize: 12,
  };
  const row = { display: "flex", gap: 16, flexWrap: "wrap" };
  const card = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginTop: 12 };

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}
          >
            ←
          </button>
          <div>
            <b>내 책장</b> / <b>책 상세</b>
          </div>
        </div>
        <button aria-label="설정" style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>
          ⚙
        </button>
      </div>

      {/* 핵심 정보 */}
      <div style={{ ...row, marginTop: 16, alignItems: "flex-start" }}>
        <div style={{ width: 140, height: 200, background: "#e5e7eb", borderRadius: 8 }} />
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ margin: "0 0 8px" }}>JAVA 마스터</h2>
          <div>
            저자 | 출판사: <b>송미영</b> | <b>A출판사</b>
          </div>

          {/* 상태 라디오 */}
          <fieldset style={{ border: 0, padding: 0, marginTop: 8 }}>
            <legend style={{ position: "absolute", left: -9999 }}>읽기 상태</legend>
            {["안읽음", "진행중", "완독"].map((s) => (
              <label key={s} style={{ marginRight: 10 }}>
                <input type="radio" name="status" checked={status === s} onChange={() => setStatus(s)} /> {s}
              </label>
            ))}
          </fieldset>

          {/* 태그 */}
          <div style={{ marginTop: 8 }}>
            태그:
            {tags.map((t) => (
              <span key={t} style={chip}>
                #{t}
              </span>
            ))}
          </div>

          {/* 진행도: 슬라이더 + 퀵칩(±1/±5/±10) */}
          <div style={{ marginTop: 12 }}>
            <ProgressEditor
              current={progress.current}
              total={progress.total}
              onChangeCurrent={setCurrent}
            />
          </div>
        </div>
      </div>

      {/* 완독 정보 */}
      <section style={card}>
        <h3 style={{ margin: 0 }}>완독 정보</h3>
        <div>- 완독일: 2025-09-10</div>
        <div>- 한줄리뷰: "핵심 개념이 잘 정리됨"</div>
        <div>- 평점: ★★★★☆</div>
      </section>

      {/* 기본 정보 */}
      <section style={card}>
        <h3 style={{ margin: 0 }}>기본 정보</h3>
        <div>- 출간일: 2023-05-01</div>
        <div>- ISBN: 979-11-XXXX-XXXX-1</div>
        <div>- 메모: "CH3 패턴 정리 다시 읽기"</div>
      </section>

      {/* 읽기 기록 */}
      <section style={card}>
        <h3 style={{ margin: 0 }}>읽기 기록</h3>
        <div>- 2025-09-20: 90 → 120쪽 (30쪽)</div>
        <div>- 2025-09-18: 60 → 90쪽 (30쪽)</div>
        <div>- 2025-09-15: 20 → 60쪽 (40쪽)</div>
      </section>

      {/* 액션 버튼 (예시) */}
      <div style={{ ...row, marginTop: 12 }}>
        <button onClick={() => alert("리뷰 편집 모달")}>[리뷰 편집]</button>
        <button onClick={() => setTags((ts) => (ts.includes("DB") ? ts : [...ts, "DB"]))}>[태그 편집(+DB)]</button>
      </div>
    </div>
  );
}
