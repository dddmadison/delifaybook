import React from "react";

function statusLabel(status) {
  if (status === "reading") return "읽는 중";
  if (status === "done") return "완독";
  return "읽고 싶음"; // ✨ '읽고 싶음'으로 통일
}

// 상태별 뱃지 스타일 클래스 매핑
function getStatusClass(status) {
  if (status === "reading") return "badge-reading";
  if (status === "done") return "badge-done";
  return "badge-unread";
}

export default function BookCard({ book, onClick }) {
  const cover = book?.coverUrl || "/nocover.png"; 
  // status가 없거나 unread/wish면 모두 'wish'로 취급
  const status = book?.status || "wish";

  const handleKeyDown = (e) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="bookCard"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <div className="bookCoverWrap">
        <img className="bookCover" src={cover} alt={book?.title} />
        {/* 상태 뱃지 */}
        <span className={`bookBadge ${getStatusClass(status)}`}>
          {statusLabel(status)}
        </span>
      </div>

      <div className="bookInfo">
        <div className="bookTitle">{book?.title || "제목 없음"}</div>
        <div className="bookAuthor">{book?.author || "저자 미상"}</div>
      </div>
    </div>
  );
}