package com.delifaybook.server.domain.notes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "notes",
        indexes = {
                @Index(name = "idx_notes_user_isbn_updated", columnList = "user_id,isbn,updated_at")
        }
)
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "isbn", nullable = false, length = 20)
    private String isbn;

    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    protected Note() { }

    public Note(Long userId, String isbn, String content) {
        this.userId = userId;
        this.isbn = isbn;
        this.content = content;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getIsbn() { return isbn; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setContent(String content) { this.content = content; }
}
