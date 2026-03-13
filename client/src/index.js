// client/src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// 👇 [중요] 이 줄을 꼭 추가해주세요! 스타일 파일을 연결하는 코드입니다.
import "./index.css"; 

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { BooksProvider } from "./context/BooksContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <BooksProvider>
        <App />
      </BooksProvider>
    </AuthProvider>
  </BrowserRouter>
);