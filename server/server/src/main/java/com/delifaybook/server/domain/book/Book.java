package com.delifaybook.server.domain.book;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "books")
public class Book {

    @Id
    @Column(name = "isbn", nullable = false)
    private String isbn;

    @Column(name = "title")
    private String title;

    @Column(name = "author")
    private String author;

    @Column(name = "publisher")
    private String publisher;

    @Column(name = "cover_url")
    private String coverUrl;

    @Column(name = "publish_date")
    private String publishDate;

    @Column(name = "item_page")
    private Integer itemPage;

    protected Book() {}

    public Book(String isbn) {
        this.isbn = isbn;
    }

 // 수동 등록을 위한 모든 필드 포함 생성자
    public Book(String isbn, String title, String author, String publisher, String publishDate, String coverUrl) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.publisher = publisher;
        this.publishDate = publishDate;
        this.coverUrl = coverUrl;
    }

    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }

    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = publisher; }

    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }

    public String getPublishDate() { return publishDate; }
    public void setPublishDate(String publishDate) { this.publishDate = publishDate; }

    public Integer getItemPage() { return itemPage; }
    public void setItemPage(Integer itemPage) { this.itemPage = itemPage; }
}
