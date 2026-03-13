//pages/BookDetailPage.jsx
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useBooks } from "../context/BooksContext";

import { getBookByIsbn, uploadAiCover } from "../api/books.api";
import "../styles/bookDetail.css";

import imageCompression from 'browser-image-compression';

function calcPercent(current, total) {
  const c = Number(current ?? 0);
  const t = Number(total ?? 0);
  if (!t || t <= 0) return 0;
  return Math.round((c / t) * 100);
}

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(
      d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "-";
  }
};

function LoadingView() {
  return (
    <div className="bdPage">
      <div className="bdContainer" style={{ textAlign: "center", marginTop: 100 }}>
        <h2>불러오는 중...</h2>
      </div>
    </div>
  );
}

function ErrorView({ message, error }) {
  return (
    <div className="bdPage">
      <div className="bdContainer" style={{ textAlign: "center", marginTop: 100 }}>
        <h2>{message}</h2>
        {error && <p>{error}</p>}
        <Link to="/bookshelf" className="btn btn-primary" style={{ marginTop: 20, display: "inline-block" }}>
          돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isbn = String(params.id ?? params.isbn ?? "").trim();

  const ctx = useBooks();
  const {
    bookshelf = [],
    progressByIsbn = {},
    notesByIsbn = {},
    hydrated,
    loadingBooks,
    addToBookshelf,
    removeBook,
    updateProgress,
    addNote,
    deleteNote,
    loadNotes,
  } = ctx;

  // ------------------------------------------------------------------
  // 1. 모든 React Hooks (useState, useMemo, useEffect)는 최상단에 위치합니다.
  // ------------------------------------------------------------------
  
  // [추가된 마법의 코드] 상세 페이지 진입 시 무조건 스크롤 맨 위로!
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" }); 
  }, [location.pathname]);
  
  const myBook = useMemo(() => {
    if (!isbn) return null;
    if (!Array.isArray(bookshelf)) return null;
    return bookshelf.find((b) => String(b?.isbn) === String(isbn)) || null;
  }, [bookshelf, isbn]);

  const navBook = location.state?.book || null;

  const [remoteBook, setRemoteBook] = useState(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState("");

  const book = myBook || navBook || remoteBook;
  const isMyBook = !!myBook;
  const fromPath = location.state?.from || "/bookshelf";

  // 탭 및 모달 상태
  const [tab, setTab] = useState("info");
  const [showProgressModal, setShowProgressModal] = useState(false);
  
  // 진행도 입력 상태
  const [newCurrent, setNewCurrent] = useState("");
  const [newTotal, setNewTotal] = useState(""); 
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressError, setProgressError] = useState("");

  // 메모 상태
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [localNotes, setLocalNotes] = useState([]);

  // AI 표지 관련 상태 (끌어올림)
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Remote Lookup Effect
  useEffect(() => {
    let alive = true;

    async function run() {
      if (!isbn) return;
      if (myBook || navBook) {
        setRemoteBook(null);
        setRemoteError("");
        return;
      }

      setLoadingRemote(true);
      setRemoteError("");

      try {
        const b = await getBookByIsbn(isbn);
        if (!alive) return;
        setRemoteBook(b || null);
      } catch (e) {
        if (!alive) return;
        setRemoteBook(null);
        setRemoteError(e?.message || "책 정보를 불러오지 못했습니다.");
      } finally {
        if (!alive) return;
        setLoadingRemote(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [isbn, myBook, navBook]);

  // Load Notes Effect
  useEffect(() => {
    if (!isbn || !isMyBook || typeof loadNotes !== "function") return;
    loadNotes(isbn);
  }, [isbn, isMyBook, loadNotes]);

  const serverNotes = useMemo(() => {
    return (notesByIsbn && notesByIsbn[isbn]) || [];
  }, [notesByIsbn, isbn]);

  useEffect(() => {
    const hasTemp = localNotes.some((n) => n?.isTemp);
    if (hasTemp && serverNotes.length > 0) {
      setLocalNotes([]);
    }
  }, [serverNotes, localNotes]);

  const displayNotes = useMemo(() => {
    const merged = [...localNotes, ...serverNotes];
    const seen = new Set();
    const out = [];
    for (const n of merged) {
      if (!n) continue;
      const key = n.id ? `id:${n.id}` : `c:${n.content}|t:${n.createdAt}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(n);
    }
    return out;
  }, [localNotes, serverNotes]);

  // ------------------------------------------------------------------
  // 2. 파생 데이터 및 핸들러 함수들
  // ------------------------------------------------------------------
  const rawProgress = (progressByIsbn && progressByIsbn[isbn]) || book?.progress || {
    current: 0,
    total: 0,
    updatedAt: "-",
  };

  const displayTotalPage = book?.itemPage || rawProgress.total || 0;
  const progress = { ...rawProgress, total: displayTotalPage };
  const percent = calcPercent(progress.current, displayTotalPage);
  const statusLabel = { unread: "읽고 싶음", wish: "읽고 싶음", reading: "읽는 중", done: "완독" };
  const coverUrl = book?.coverUrl || book?.cover || "/nocover.png";

  const openProgress = () => {
    setProgressError("");
    setNewCurrent(String(progress.current ?? 0));
    setNewTotal(displayTotalPage > 0 ? String(displayTotalPage) : "");
    setShowProgressModal(true);
  };

  const saveProgress = async () => {
    if (savingProgress) return;
    setProgressError("");

    const current = Number(newCurrent);
    const totalInput = Number(newTotal);

    if (isNaN(current) || current < 0) {
      setProgressError("0페이지 이상 입력해주세요.");
      return;
    }
    
    if (isNaN(totalInput) || totalInput <= 0) {
      setProgressError("전체 페이지 수를 입력해주세요.");
      return;
    }

    if (current > totalInput) {
      setProgressError(`현재 페이지가 전체(${totalInput}p)를 초과할 수 없습니다.`);
      return;
    }

    try {
      setSavingProgress(true);
      if (typeof updateProgress === "function") {
        await updateProgress(isbn, current, totalInput); 
      }
      setShowProgressModal(false);
    } catch (e) {
      setProgressError(e?.message || "저장에 실패했습니다.");
    } finally {
      setSavingProgress(false);
    }
  };

  const onAddNote = async (e) => {
    e.preventDefault();
    if (savingNote) return;

    const text = String(newNote ?? "").trim();
    if (!text) return;

    setNoteError("");
    const tempNote = {
      id: `temp-${Date.now()}`,
      content: text,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    setLocalNotes((prev) => [tempNote, ...prev]);
    setNewNote("");

    try {
      setSavingNote(true);
      if (typeof addNote === "function") {
        await addNote(isbn, text);
      }
      if (typeof loadNotes === "function") loadNotes(isbn);
    } catch (e2) {
      setNoteError(e2?.message || "메모 저장 실패");
      setLocalNotes((prev) => prev.filter((n) => n.id !== tempNote.id));
      setNewNote(text);
    } finally {
      setSavingNote(false);
    }
  };

  const onDeleteNote = async (noteId) => {
    if (!window.confirm("메모를 삭제하시겠습니까?")) return;
    const backup = localNotes;
    setLocalNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      if (typeof deleteNote === "function") await deleteNote(isbn, noteId);
      if (typeof loadNotes === "function") loadNotes(isbn);
    } catch {
      alert("삭제 실패");
      setLocalNotes(backup);
    }
  };

  const handleAddToBookshelf = async () => {
    if (typeof addToBookshelf !== "function") return alert("기능 준비 중입니다.");
    if (!window.confirm("이 책을 책장에 담으시겠습니까?")) return;
    try {
      await addToBookshelf(book);
      alert("책장에 추가되었습니다!");
    } catch (e) {
      alert("추가 실패: " + (e?.message || "오류 발생"));
    }
  };

  const handleDeleteBook = async () => {
    if (typeof removeBook !== "function") return alert("기능 준비 중입니다.");
    if (!window.confirm("정말 삭제하시겠습니까? 작성한 메모와 기록이 모두 사라집니다.")) return;
    try {
      await removeBook(isbn);
      navigate("/bookshelf", { replace: true });
    } catch (e) {
      alert("삭제 실패: " + (e?.message || "오류 발생"));
    }
  };

  // AI 표지 파일 선택 핸들러
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

  // 이미지가 크면 압축에 1~2초 걸릴 수 있으므로 로딩 상태를 켜줍니다.
    setIsGenerating(true); 

    try {
      // 이미지 압축 옵션 설정
      const options = {
        maxSizeMB: 1, // 최대 1MB 이하로 맞춤
        maxWidthOrHeight: 1920, // 가로나 세로 최대 픽셀 (OpenCV가 인식하기 딱 좋은 크기)
        useWebWorker: true, // 브라우저 메인 스레드를 막지 않게 워커 사용 (버벅임 방지!)
      };

      // 압축 실행!
      const compressedFile = await imageCompression(file, options);
    
      // 압축된 파일로 상태 업데이트
      setSelectedFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
    
      console.log(`원본 크기: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`압축 후 크기: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
      alert("이미지 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      console.error("Image compression error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // AI 표지 생성 요청 핸들러 (사용하지 않는 변수 경고 해결)
  const handleGenerateAiCover = async () => {
    if (!selectedFile) return alert("책 사진을 먼저 업로드해주세요!");
    
    setIsGenerating(true);
    try {
      await uploadAiCover(book.isbn, selectedFile);
      alert("AI 표지가 성공적으로 생성되었습니다!");
      window.location.reload(); 
    } catch (err) {
      alert("표지 생성 실패: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ------------------------------------------------------------------
  // 3. 조건부 반환 (Early Return) 영역
  // ※ 반드시 모든 React Hooks 아래에 위치해야 에러가 발생하지 않습니다!
  // ------------------------------------------------------------------
  if (!isbn) return <ErrorView message="잘못된 접근입니다." />;
  if ((loadingBooks && !hydrated) || (loadingRemote && !book)) return <LoadingView />;
  if (!book && hydrated && !loadingRemote) return <ErrorView message="책을 찾을 수 없습니다." error={remoteError} />;

  const safeTitle = book?.title || `책 (${isbn})`;
  const safeAuthor = book?.author || "-";
  const safePublisher = book?.publisher || null;
  const safePublishDate = book?.publishDate || book?.pubDate || "-";

  const isWishState = !book?.status || book.status === "wish" || book.status === "unread";

  // ------------------------------------------------------------------
  // 4. 컴포넌트 렌더링
  // ------------------------------------------------------------------
  return (
    <div className="bdPage">
      <div className="bdBackdrop">
        <img src={coverUrl} alt="" className="bdBlurImg" />
      </div>

      <div className="bdContainer">
        <nav className="bdNav">
          <button onClick={() => navigate(fromPath)} className="bdBackLink">
            ← 뒤로가기
          </button>
        </nav>

        <div className="bdGrid">
          <div className="bdColLeft">
            <div className="bdCoverWrap">
              <img src={coverUrl} alt={safeTitle} className="bdCoverImg" />
            </div>
          </div>

          <div className="bdColRight">
            <header className="bdHeader">
              <div className="bdHeaderMain">
                <h1 className="bdHeaderTitle">
                  {safeTitle}
                  {isMyBook && book?.status && (
                    <span className={`bdBadge ${book.status}`}>
                      {statusLabel[book.status] || statusLabel.wish}
                    </span>
                  )}
                </h1>

                <div className="bdMetaInfo">
                  <span>{safeAuthor}</span>
                  {safePublisher && <span> • {safePublisher}</span>}
                </div>

                {(book?.tags || []).length > 0 && (
                  <div className="bdTags">
                    {book.tags.map((t) => (
                      <span key={t} className="bdTag">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bdHeaderActions">
                {isMyBook ? (
                  <button className="bdDeleteBtnSmall" onClick={handleDeleteBook} title="삭제">
                    삭제
                  </button>
                ) : (
                  <button className="bdAddBtnSmall" onClick={handleAddToBookshelf}>
                    + 책장에 담기
                  </button>
                )}
              </div>
            </header>

            {isMyBook && (
              <div className="bdProgressCard">
                {isWishState ? (
                  <div className="bdStartSection">
                    <div className="bdStartTextWrap">
                      <div className="bdStartTitle">
                        이 책을 읽기 시작하셨나요?
                      </div>
                      <div className="bdStartDesc">
                        첫 기록을 남기고 독서를 시작해보세요.
                      </div>
                      
                      {displayTotalPage > 0 ? (
                        <div className="bdStartPageInfo">
                          총 {displayTotalPage} 페이지
                        </div>
                      ) : (
                        <div className="bdStartPageInfo" style={{ color: "#e03131", fontSize: 12 }}>
                          ⚠️ 페이지 정보가 없습니다. 시작 시 입력해주세요.
                        </div>
                      )}
                    </div>
                    <button className="btn btn-primary bdStartBtn" onClick={openProgress}>
                      독서 시작하기
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bdProgressHeader">
                      <span className="bdProgressLabel">독서 진행률</span>
                      <span className="bdProgressValue">
                        {percent}%{" "}
                        <span className="bdProgressSub">
                          ({progress.current} / {displayTotalPage > 0 ? displayTotalPage : "?"}p)
                        </span>
                      </span>
                    </div>

                    <div className="bdProgressBar">
                      <div
                        className="bdProgressFill"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>

                    <div className="bdProgressFooter">
                      <span className="bdUpdatedAt">
                        마지막 기록: {formatDate(progress.updatedAt)}
                      </span>
                      <button className="btn btn-primary btn-sm" onClick={openProgress}>
                        기록하기
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div>
              <div className="bdTabs">
                <button className={`bdTabBtn ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>
                  기본 정보
                </button>
                <button
                  className={`bdTabBtn ${tab === "notes" ? "active" : ""}`}
                  onClick={() => setTab("notes")}
                  disabled={!isMyBook}
                >
                  메모 ({displayNotes.length})
                </button>
                <button className={`bdTabBtn ${tab === "share" ? "active" : ""}`} onClick={() => setTab("share")} disabled={!isMyBook}>
                  공유
                </button>
                <button className={`bdTabBtn ${tab === "ai_cover" ? "active" : ""}`} onClick={() => setTab("ai_cover")} disabled={!isMyBook}>
                  AI 표지
                </button>
              </div>

              <div className="bdTabContent">
                {tab === "info" && (
                  <div className="bdItem">
                    <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-main)" }}>
                      {book?.description && <p className="bdDesc">{book.description}</p>}

                      <strong>ISBN:</strong> {isbn}
                      <br />
                      <strong>출판일:</strong> {safePublishDate}
                      <br />
                      <strong>페이지:</strong> {displayTotalPage > 0 ? `${displayTotalPage}쪽` : "-"}
                    </div>
                  </div>
                )}

                {tab === "notes" && (
                  <>
                    <form className="bdNoteInputWrap" onSubmit={onAddNote}>
                      <input
                        className="bdNoteInput"
                        placeholder="기억하고 싶은 문장을 기록하세요..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        disabled={savingNote}
                      />
                      <button type="submit" className="bdNoteSubmit" disabled={savingNote || !newNote.trim()}>
                        등록
                      </button>
                    </form>

                    {noteError && (
                      <div className="bdModalError" style={{ marginBottom: 10 }}>
                        {noteError}
                      </div>
                    )}

                    <div className="bdMemoList">
                      {displayNotes.length === 0 ? (
                        <div className="bdEmptyTab">작성된 메모가 없습니다.</div>
                      ) : (
                        displayNotes.map((n) => (
                          <div key={n.id || Math.random()} className="bdMemoItem">
                            <div className="bdMemoContent">{n.content || n.text}</div>
                            <div className="bdMemoFooter">
                              <span className="bdMemoDate">{formatDate(n.createdAt || n.updatedAt)}</span>
                              {!n.isTemp && (
                                <button className="bdMemoDelete" onClick={() => onDeleteNote(n.id)}>
                                  삭제
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {tab === "share" && (
                  <div className="bdEmptyTab">
                    <p style={{ marginBottom: 10, fontSize: 16, fontWeight: 700 }}>📢 독서 공유하기</p>
                    <p>
                      이 책을 읽은 다른 유저들과
                      <br />
                      생각을 나눌 수 있는 공간이 준비 중입니다.
                    </p>
                  </div>
                )}

                {tab === "ai_cover" && (
                  <div className="bdAiSection">
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                      <p style={{ marginBottom: 10, fontSize: 16, fontWeight: 700 }}>나만의 표지 만들기</p>
                      <p style={{ color: "var(--text-sub)", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
                        책 표지 이미지가 없나요?<br/>
                        사진을 찍어 올리면 AI가 멋진 디지털 표지로 재탄생시켜 드립니다!
                      </p>

                      <div style={{
                        width: "200px", height: "300px", margin: "0 auto 20px", 
                        border: "2px dashed var(--border-color)", borderRadius: "8px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        overflow: "hidden", backgroundColor: "var(--secondary-color)",
                        position: "relative"
                      }}>
                        {previewUrl ? (
                          <img src={previewUrl} alt="미리보기" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", color: "var(--text-sub)" }}>
                            <span style={{ fontSize: "40px" }}>📷</span>
                            <span style={{ fontSize: "13px" }}>표지를 정면에서 찍어주세요</span>
                          </div>
                        )}
                        
                        {/* 로딩 중일 때 표시되는 오버레이 */}
                        {isGenerating && (
                          <div style={{
                            position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white"
                          }}>
                            <span style={{ fontSize: "30px", marginBottom: "10px", animation: "spin 2s linear infinite" }}>⏳</span>
                            <span style={{ fontSize: "14px", fontWeight: "bold" }}>AI가 다림질 중...</span>
                          </div>
                        )}
                      </div>

                      {/* 1. 카메라 직접 촬영용 Input (모바일 후면 카메라 즉시 실행) */}
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                        id="ai-cover-camera"
                      />

                      {/* 2. 갤러리 선택용 Input */}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                        id="ai-cover-gallery"
                      />
                      
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                        {/* 카메라 버튼 */}
                        <label htmlFor="ai-cover-camera" className="btn btn-ghost" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                          📸 직접 촬영
                        </label>
                        
                        {/* 갤러리 버튼 */}
                        <label htmlFor="ai-cover-gallery" className="btn btn-ghost" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                          📁 갤러리
                        </label>
                      </div>

                      <div style={{ marginTop: "16px" }}>
                        {/* 표지 생성 실행 버튼 */}
                        <button 
                          className="btn btn-primary" 
                          onClick={handleGenerateAiCover}
                          disabled={!selectedFile || isGenerating}
                          style={{ width: "100%", maxWidth: "240px", padding: "12px" }}
                        >
                          {isGenerating ? "처리 중입니다..." : "AI 디지털 표지 만들기"}
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {showProgressModal && (
        <div className="bdModalOverlay" onClick={() => !savingProgress && setShowProgressModal(false)}>
          <div className="bdModal" onClick={(e) => e.stopPropagation()}>
            <h3 className="bdModalTitle">진행도 업데이트</h3>

            <div className="bdModalField">
              <label className="bdModalLabel">현재 페이지</label>
              <input
                className="bdModalInput"
                value={newCurrent}
                onChange={(e) => setNewCurrent(e.target.value)}
                inputMode="numeric"
                disabled={savingProgress}
                autoFocus
                placeholder="몇 페이지까지 읽으셨나요?"
              />
            </div>

            <div className="bdModalField">
              <label className="bdModalLabel">전체 페이지</label>
              <input
                className="bdModalInput"
                value={newTotal}
                onChange={(e) => setNewTotal(e.target.value)}
                inputMode="numeric"
                disabled={savingProgress || displayTotalPage > 0}
                placeholder="전체 페이지 수"
                style={{ 
                   backgroundColor: displayTotalPage > 0 ? "#f0f0f0" : "#fff",
                   color: displayTotalPage > 0 ? "#888" : "#000"
                }}
              />
              {displayTotalPage === 0 && (
                 <div style={{ marginTop: 6, fontSize: 12, color: "var(--primary-color)" }}>
                   ※ 도서관 데이터에 페이지 정보가 없습니다. 직접 입력해주세요.
                 </div>
              )}
            </div>

            {progressError && <div className="bdModalError">{progressError}</div>}

            <div className="bdModalActions">
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveProgress} disabled={savingProgress}>
                {savingProgress ? "저장 중..." : "저장하기"}
              </button>
              <button className="btn btn-ghost" onClick={() => !savingProgress && setShowProgressModal(false)} disabled={savingProgress}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}