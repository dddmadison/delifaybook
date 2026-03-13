// client/src/api/runtime.js

// ✅ .env 설정과 상관없이 무조건 서버와 통신하도록 강제 설정
export const USE_MOCK = false; 

// 기존 코드는 주석 처리 하거나 삭제
// export const USE_MOCK =
//   String(process.env.REACT_APP_USE_MOCK || "").toLowerCase() === "true";