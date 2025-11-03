// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Search from "./pages/Search";
import BookShelf from "./pages/BookShelf";
import BookDetail from "./pages/BookDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/shelf" element={<BookShelf />} />
        <Route path="/book/:id" element={<BookDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
