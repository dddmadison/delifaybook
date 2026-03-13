import React, { useState, useEffect, useRef } from "react";

const ManualRegisterForm = ({ searchKeyword, onRegister }) => {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    publisher: "",
  });

  const containerRef = useRef(null);

  useEffect(() => {
    if (searchKeyword) {
      setFormData((prev) => ({ ...prev, title: searchKeyword }));
    }
  }, [searchKeyword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author) {
      alert("제목과 저자는 필수 입력 항목입니다.");
      return;
    }
    onRegister(formData);
  };

  const scrollFormIntoView = () => {
    if (!containerRef.current) return;

    setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 250);

    setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 500);
  };

  return (
    <div
      ref={containerRef}
      className="manual-register-container"
      style={{
        padding: "24px",
        textAlign: "center",
        border: "1px dashed #ddd",
        borderRadius: "12px",
        margin: "20px 0 140px",
        backgroundColor: "#f9f9f9",
        scrollMarginTop: "100px",
      }}
    >
      <h3 style={{ marginBottom: "10px" }}>찾는 책이 결과에 없나요?</h3>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        직접 정보를 입력하여 내 책장에 추가할 수 있습니다.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "400px",
          margin: "0 auto",
        }}
      >
        <input
          type="text"
          placeholder="책 제목 *"
          value={formData.title}
          onFocus={scrollFormIntoView}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            fontSize: "16px",
            backgroundColor: "#fff",
          }}
        />
        <input
          type="text"
          placeholder="저자 *"
          value={formData.author}
          onFocus={scrollFormIntoView}
          onChange={(e) =>
            setFormData({ ...formData, author: e.target.value })
          }
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            fontSize: "16px",
            backgroundColor: "#fff",
          }}
        />
        <input
          type="text"
          placeholder="출판사 (선택)"
          value={formData.publisher}
          onFocus={scrollFormIntoView}
          onChange={(e) =>
            setFormData({ ...formData, publisher: e.target.value })
          }
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            fontSize: "16px",
            backgroundColor: "#fff",
          }}
        />

        <button
          type="submit"
          style={{
            marginTop: "10px",
            padding: "12px",
            backgroundColor: "#333",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
          }}
        >
          직접 등록하기
        </button>
      </form>
    </div>
  );
};

export default ManualRegisterForm;