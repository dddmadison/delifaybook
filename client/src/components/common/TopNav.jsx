// client/src/components/common/TopNav.jsx
import React from "react";
import { NavLink, Link } from "react-router-dom";
import "../../styles/nav.css";

export default function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav__inner">
        {/* 로고 클릭 시 홈으로 이동 */}
        <Link to="/" className="topnav__brand">
          DelifayBook
        </Link>

        <nav className="topnav__links">
          <NavLink 
            to="/" 
            end 
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            홈
          </NavLink>
          <NavLink 
            to="/bookshelf" 
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            책장
          </NavLink>
          <NavLink 
            to="/search" 
            className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          >
            검색
          </NavLink>
        </nav>
      </div>
    </header>
  );
}