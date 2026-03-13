package com.delifaybook.server.api.books.dto;

import com.delifaybook.server.domain.book.Book;

public class BookLookupResponse {

    private String isbn;
    private String title;
    private String author;
    private String publisher;
    private String coverUrl;
    private String publishDate;
    private Integer itemPage;

    // ✅ 기본 생성자 (필수)
    public BookLookupResponse() {}

    public static BookLookupResponse from(Book book) {
    	BookLookupResponse response = new BookLookupResponse();
        response.setIsbn(book.getIsbn());
        response.setTitle(book.getTitle());
        response.setAuthor(book.getAuthor());
        response.setPublisher(book.getPublisher());
        response.setCoverUrl(book.getCoverUrl());
        response.setPublishDate(book.getPublishDate());
        response.setItemPage(book.getItemPage()); 
        
        return response;
    }

    // Getters
    public String getIsbn() { return isbn; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getPublisher() { return publisher; }
    public String getCoverUrl() { return coverUrl; }
    public String getPublishDate() { return publishDate; }
    public Integer getItemPage() { return itemPage; }

    // ✅ Setters (Controller에서 값을 채워넣기 위해 필수)
    public void setIsbn(String isbn) { this.isbn = isbn; }
    public void setTitle(String title) { this.title = title; }
    public void setAuthor(String author) { this.author = author; }
    public void setPublisher(String publisher) { this.publisher = publisher; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }
    public void setPublishDate(String publishDate) { this.publishDate = publishDate; }
    public void setItemPage(Integer itemPage) { this.itemPage = itemPage; }
}