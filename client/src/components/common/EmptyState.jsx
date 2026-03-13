// client/src/components/common/EmptyState.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function EmptyState({
  icon = "📚",
  title = "아직 책장이 비어있어요",
  desc = "읽고 있는 책을 검색해서 추가해보세요.",
  primaryText = "책 검색하기",
  primaryTo = "/search",
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-sub)', marginBottom: '24px' }}>
        {desc}
      </p>

      <Link className="btn btn-primary" to={primaryTo}>
        {primaryText}
      </Link>
    </div>
  );
}