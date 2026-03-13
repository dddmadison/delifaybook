// client/src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import RequireAuth from "./routes/RequireAuth";

import HomePage from "./pages/HomePage";
import BookshelfPage from "./pages/BookshelfPage";
import SearchPage from "./pages/SearchPage";
import BookDetailPage from "./pages/BookDetailPage";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

function NotFound() {
  return <div style={{ padding: 16 }}>404 - Not Found</div>;
}

export default function App() {
  console.log("[App] routes loaded");

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />

        <Route
          path="bookshelf"
          element={
            <RequireAuth>
              <BookshelfPage />
            </RequireAuth>
          }
        />

        <Route
          path="search"
          element={
            <RequireAuth>
              <SearchPage />
            </RequireAuth>
          }
        />

        <Route
          path="book/:id"
          element={
            <RequireAuth>
              <BookDetailPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}
