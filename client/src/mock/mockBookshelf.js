export const initialBookshelf = [
  {
    isbn: "1",
    title: "JAVA 마스터",
    author: "송미영",
    coverUrl: "https://dummyimage.com/140x200/ddd/333.png&text=JAVA",
    status: "reading", // unread | reading | done
    tags: ["개발", "자바"],
  },
  {
    isbn: "2",
    title: "클린 코드",
    author: "Robert C. Martin",
    coverUrl: "https://dummyimage.com/140x200/ddd/333.png&text=CLEAN",
    status: "done",
    tags: ["개발"],
  },
];

export const initialProgress = {
  "1": { current: 120, total: 300, updatedAt: "2025-12-13 13:10" },
  "2": { current: 350, total: 350, updatedAt: "2025-11-01 10:20" },
};

export const initialNotes = {
  "1": [{ id: 1, content: "CH3 패턴 정리 다시 읽기", updatedAt: "2025-12-10 21:10" }],
};

export const initialLogs = {
  "1": [
    { id: 101, date: "2025-12-13", from: 90, to: 120 },
    { id: 102, date: "2025-12-11", from: 60, to: 90 },
  ],
};
