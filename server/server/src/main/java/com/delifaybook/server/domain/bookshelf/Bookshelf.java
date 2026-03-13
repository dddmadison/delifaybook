package com.delifaybook.server.domain.bookshelf;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Converter;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "bookshelf",
        uniqueConstraints = {
                @jakarta.persistence.UniqueConstraint(
                        name = "uk_bookshelf_user_isbn",
                        columnNames = {"user_id", "isbn"}
                )
        },
        indexes = {
                @Index(name = "idx_bookshelf_user_status", columnList = "user_id,status"),
                @Index(name = "idx_bookshelf_isbn", columnList = "isbn")
        }
)
public class Bookshelf {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "isbn", nullable = false, length = 20)
    private String isbn;

    // DB: enum('unread','reading','done')
    @Convert(converter = BookshelfStatusConverter.class)
    @Column(name = "status", nullable = false)
    private BookshelfStatus status;

    // DB: tags json
    @Column(name = "tags", columnDefinition = "json")
    private String tagsJson;

    // DB: tinyint unsigned -> Java: Byte
    @Column(name = "rating", columnDefinition = "tinyint unsigned")
    private Byte rating;

    @Column(name = "review_short", length = 255)
    private String reviewShort;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    // ✅ JPA 기본 생성자 (반드시 protected)
    protected Bookshelf() {}

    // ✅ 우리 서비스에서 쓰는 기본 생성자
    public Bookshelf(Long userId, String isbn) {
        this(userId, isbn, BookshelfStatus.unread);
    }

    public Bookshelf(Long userId, String isbn, BookshelfStatus status) {
        this.userId = userId;
        this.isbn = isbn;
        this.status = (status != null ? status : BookshelfStatus.unread);
        this.tagsJson = "[]"; // 기본값(없으면 null로 남아도 되지만 SOT에서 안정적)
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getIsbn() { return isbn; }
    public BookshelfStatus getStatus() { return status; }
    public String getTagsJson() { return tagsJson; }
    public Byte getRating() { return rating; }
    public String getReviewShort() { return reviewShort; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setStatus(BookshelfStatus status) { this.status = status; }
    public void setTagsJson(String tagsJson) { this.tagsJson = tagsJson; }
    public void setRating(Byte rating) { this.rating = rating; }
    public void setReviewShort(String reviewShort) { this.reviewShort = reviewShort; }

    @Converter(autoApply = false)
    public static class BookshelfStatusConverter implements jakarta.persistence.AttributeConverter<BookshelfStatus, String> {
        @Override
        public String convertToDatabaseColumn(BookshelfStatus attribute) {
            if (attribute == null) return null;
            return attribute.name().toLowerCase();
        }

        @Override
        public BookshelfStatus convertToEntityAttribute(String dbData) {
            if (dbData == null) return null;
            try {
                // enum이 소문자로 정의되어 있으면 그대로
                return BookshelfStatus.valueOf(dbData);
            } catch (IllegalArgumentException ignore) {
                // enum이 대문자로 정의되어 있으면 변환
                return BookshelfStatus.valueOf(dbData.toUpperCase());
            }
        }
    }
}
