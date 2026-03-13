// client/src/layouts/AppLayout.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopNav from "../components/common/TopNav";
import { useBooks } from "../context/BooksContext";
import { useAuth } from "../context/AuthContext";
import "../styles/appLayout.css";

function AppSkeleton() {
  return (
    <div className="skeletonWrap">
      <div className="skeletonHero" />
      <div className="skeletonTitle" />
      <div className="skeletonRow">
        <div className="skeletonCard" />
        <div className="skeletonCard" />
      </div>
      <div className="skeletonRow">
        <div className="skeletonCard" />
        <div className="skeletonCard" />
      </div>
      <div className="skeletonList">
        <div className="skeletonLine" />
        <div className="skeletonLine" />
        <div className="skeletonLine short" />
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { hydrated } = useBooks();
  const { status } = useAuth();
  const location = useLocation();

  const p = location.pathname;
  const isProtected = p === "/bookshelf" || p === "/search" || p.startsWith("/book/");
  const showSkeleton = isProtected && status === "authenticated" && !hydrated;

  return (
    <div className="appLayout">
      <TopNav />
      <main className="appMain">{showSkeleton ? <AppSkeleton /> : <Outlet />}</main>
    </div>
  );
}
