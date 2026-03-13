package com.delifaybook.server.domain.progress;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "progress",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_progress_user_isbn", columnNames = {"user_id", "isbn"})
        },
        indexes = {
                @Index(name = "idx_progress_user_updated", columnList = "user_id,updated_at"),
                @Index(name = "idx_progress_isbn", columnList = "isbn")
        }
)
public class Progress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "isbn", nullable = false, length = 20)
    private String isbn;

    @Column(name = "current_page", nullable = false)
    private Integer currentPage = 0;

    @Column(name = "total_page")
    private Integer totalPage;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    protected Progress() { }

    public Progress(Long userId, String isbn, int currentPage, Integer totalPage) {
        this.userId = userId;
        this.isbn = isbn;
        this.currentPage = currentPage;
        this.totalPage = totalPage;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getIsbn() { return isbn; }
    public Integer getCurrentPage() { return currentPage; }
    public Integer getTotalPage() { return totalPage; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // ✅ Service에서 사용하기 위한 Setter 추가
    public void setCurrentPage(Integer currentPage) {
        this.currentPage = currentPage;
    }

    public void setTotalPage(Integer totalPage) {
        this.totalPage = totalPage;
    }

    public void update(int currentPage, Integer totalPage) {
        this.currentPage = currentPage;
        this.totalPage = totalPage;
    }
}