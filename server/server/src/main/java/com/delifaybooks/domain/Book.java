package com.delifaybooks.domain;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Book {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String title;
  private String author;
  private String publisher;
  private Integer totalPages;

  @Enumerated(EnumType.STRING)
  private Status status;

  @ElementCollection
  @CollectionTable(
      name = "book_tags",             // 별도
      joinColumns = @JoinColumn(name = "book_id") // 연결키
  )
  @Column(name = "tag", length = 100)
  private List<String> tags;

  public enum Status { UNREAD, READING, DONE }

  // ===== Getters & Setters =====
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getAuthor() { return author; }
  public void setAuthor(String author) { this.author = author; }

  public String getPublisher() { return publisher; }
  public void setPublisher(String publisher) { this.publisher = publisher; }

  public Integer getTotalPages() { return totalPages; }
  public void setTotalPages(Integer totalPages) { this.totalPages = totalPages; }

  public Status getStatus() { return status; }
  public void setStatus(Status status) { this.status = status; }

  public List<String> getTags() { return tags; }
  public void setTags(List<String> tags) { this.tags = tags; }
}
