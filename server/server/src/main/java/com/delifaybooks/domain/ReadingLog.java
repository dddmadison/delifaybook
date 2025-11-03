// src/main/java/com/delifaybooks/domain/ReadingLog.java
package com.delifaybooks.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class ReadingLog {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "book_id", nullable = false)
  private Book book;

  @Column
  private Integer currentPage;

  @Column
  private String note;

  @Column(updatable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  // getters & setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Book getBook() { return book; }
  public void setBook(Book book) { this.book = book; }
  public Integer getCurrentPage() { return currentPage; }
  public void setCurrentPage(Integer currentPage) { this.currentPage = currentPage; }
  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
