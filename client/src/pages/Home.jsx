// src/pages/Home.jsx
import { Link } from "react-router-dom";

/* =========================
   스타일 토큰 (컴포넌트 외부)
   ========================= */
const S = {
  page: {
    padding: 20,
    fontFamily: "system-ui",
    maxWidth: 980,
    margin: "0 auto",
    paddingBottom: 40,
    boxSizing: "border-box",
  },

  /* 상단 로고바 (로고만) */
  topbar: {
    borderBottom: "1px solid #e5e7eb",
    padding: "10px 0",
    display: "flex",
    alignItems: "center",
    minHeight: 48,
  },
  logo: { fontWeight: 900, fontSize: 20 },

  /* 배너 + 버튼 두 개 (wrap으로 초소형에서도 1열) */
  banner: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    margin: "12px 0",
    background: "linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 100%)",
  },
  bannerRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  bannerImgWrap: {
    flex: "0 0 140px",
    minWidth: 120,   
    maxWidth: 160,
  },
  bannerImg: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    display: "block",
  },
  bannerContent: {
    flex: "1 1 240px",          // 내용 영역은 가변
    minWidth: 220,              // 초소형 화면에서 줄바꿈 기준
  },
  bannerTitle: { fontSize: 18, fontWeight: 800, marginBottom: 8 },
  bannerDesc: { color: "#6b7280", marginBottom: 12 },
  bannerBtns: { display: "flex", gap: 8, flexWrap: "wrap" },
  btn: {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontWeight: 600,
  },

  /* 오늘의 요약 박스 */
  todayBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    background: "#ffffff",
  },
  todayIcon: { fontSize: 20, lineHeight: 1 },
  todayTitle: { fontWeight: 800, fontSize: 14 },
  todaySub: { color: "#6b7280", fontSize: 12 },
  progressWrap: {
    height: 8,
    background: "#eee",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 6,
  },
  progressBar: (w) => ({ width: `${w}%`, height: "100%", background: "#10b981" }),

  /* 섹션 타이틀 */
  sectionTitle: { fontSize: 16, fontWeight: 800, marginTop: 16, marginBottom: 8 },

  /* 현재 읽는 책 (그리드) */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 10,
    background: "#fff",
    textDecoration: "none",
    color: "#111827",
  },
  cover: {
    width: "100%",
    aspectRatio: "3/4",
    objectFit: "cover",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    display: "block",
  },
  title: {
    marginTop: 8,
    fontWeight: 700,
    fontSize: 14,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  meta: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  /* 응원 문구 */
  motto: { textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: 16, fontStyle: "italic" },

  /* 푸터 */
  footer: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    marginTop: 8,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 8,
  },
};

/* ================
   날짜 유틸 (로컬)
   ================ */
function toYMDLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function Home() {
  /* ------- Mock 데이터 ------- */
  const readingBooks = [
    { id: "978-ddd",   title: "도메인 주도 설계", read: 150, total: 350, cover: "https://placehold.co/120x160?text=DDD" },
    { id: "978-clean", title: "클린 아키텍처",   read: 60,  total: 250, cover: "https://placehold.co/120x160?text=Clean" },
    { id: "978-ref",   title: "리팩터링 2판",    read: 80,  total: 450, cover: "https://placehold.co/120x160?text=Refac" },
  ];

  // 오늘의 요약에 사용할 간단한 읽기 로그 (예시)
  const readingLogs = [
    { date: "2025-10-28", pages: 18 },
    { date: "2025-10-29", pages: 22 },
    // 오늘 데이터가 없으면 0으로 표기됨
  ];

  /* ------- 오늘의 독서 요약 계산 (로컬) ------- */
  const todayYMD = toYMDLocal(new Date());
  const todayPages = readingLogs
    .filter((l) => l.date === todayYMD)
    .reduce((sum, l) => sum + l.pages, 0);

  const dailyGoal = 30; // 임시 목표치(설정화 가능)
  const todayRatio = Math.min(100, Math.round((todayPages / dailyGoal) * 100));

  return (
    <div style={S.page}>
      {/* 상단바: 로고만 */}
      <header style={S.topbar} aria-label="상단 로고">
        <div style={S.logo}>DelifayBooks</div>
      </header>

      {/* 배너 이미지 + 문구 + [내 책장] [책 검색] */}
      <section style={S.banner} aria-labelledby="banner-title" aria-describedby="banner-desc">
        <div style={S.bannerRow}>
          <div style={S.bannerImgWrap}>
            <img
              style={S.bannerImg}
              src="https://placehold.co/280x280?text=Banner"
              alt="DelifayBooks 배너 이미지"
              onError={(e) => (e.currentTarget.src = "https://placehold.co/280x280?text=Banner")}
            />
          </div>

          <div style={S.bannerContent}>
            <h1 id="banner-title" style={S.bannerTitle}>나만의 독서 기록 서비스</h1>
            <p id="banner-desc" style={S.bannerDesc}>
              읽은 페이지를 기록하고, 진행도를 확인하고, 나의 독서 여정을 관리하세요.
            </p>
            <div style={S.bannerBtns}>
              <Link to="/bookshelf" style={S.btn}>내 책장</Link>
              <Link to="/search" style={S.btn}>책 검색</Link>
            </div>
          </div>
        </div>
        
      </section>

      {/* 현재 읽는 책 */}
      <h2 style={S.sectionTitle}>현재 읽는 책</h2>
      {readingBooks.length === 0 ? (
        <div style={{ padding: 16, border: "1px dashed #e5e7eb", borderRadius: 12, color: "#6b7280" }}>
          아직 진행 중인 책이 없어요.{" "}
          <Link to="/bookshelf" style={{ textDecoration: "underline" }}>
            내 책장에서 시작하기
          </Link>
        </div>
      ) : (
        <div style={S.grid}>
          {readingBooks.map((b) => {
            const p = Math.min(100, Math.round((b.read / b.total) * 100));
            return (
              <Link key={b.id} to={`/book/${b.id}`} style={S.card} aria-label={`${b.title} 상세로 이동`}>
                <img
                  src={b.cover}
                  alt={`${b.title} 표지`}
                  style={S.cover}
                  onError={(e) => (e.currentTarget.src = "https://placehold.co/120x160?text=No+Cover")}
                />
                <div style={S.title} title={b.title}>{b.title}</div>
                <div style={S.meta}>
                  {b.read.toLocaleString()}/{b.total.toLocaleString()}쪽 ({p}%)
                </div>
                <div
                  style={S.progressWrap}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={p}
                  aria-label={`${b.title} 진행도 ${p}%`}
                >
                  <div style={S.progressBar(p)} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 응원 한 줄 */}
      <div style={S.motto}>"책을 읽는 당신을 응원합니다."</div>

      {/* 푸터 */}
      <footer style={S.footer}>
        © {new Date().getFullYear()} DelifayBooks
      </footer>
    </div>
  );
}
