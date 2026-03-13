package com.delifaybook.server.global.external.nlk.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class NlkBookDoc {

    // ✅ 대문자(NLK), 소문자(JSON), 변형된 이름 모두 처리하도록 @JsonAlias 추가

    @JsonProperty("EA_ISBN")
    @JsonAlias({"isbn", "ISBN", "ea_isbn"}) 
    private String isbn;

    @JsonProperty("TITLE")
    @JsonAlias({"title", "Title"})
    private String title;

    @JsonProperty("AUTHOR")
    @JsonAlias({"author", "Author"})
    private String author;

    @JsonProperty("PUBLISHER")
    @JsonAlias({"publisher", "Publisher"})
    private String publisher;

    @JsonProperty("TITLE_URL") 
    @JsonAlias({"title_url", "cover_url", "COVER_URL", "IMAGE_URL", "image_url"})
    private String coverUrl;

    @JsonProperty("PUBLISH_PREDATE")
    @JsonAlias({"publish_predate", "pub_date", "PUB_DATE", "publish_date"})
    private String pubDate;

    @JsonProperty("PAGE")
    @JsonAlias({"page", "Page"})
    private String page;

    // Helper: 빈 문자열을 null로 처리
    private static String trimToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    // Getters & Setters
    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = trimToNull(isbn); }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = trimToNull(title); }

    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = trimToNull(author); }

    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = trimToNull(publisher); }

    public String getCoverUrl() { return coverUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = trimToNull(coverUrl); }

    public String getPubDate() { return pubDate; }
    public void setPubDate(String pubDate) { this.pubDate = trimToNull(pubDate); }

    public String getPage() { return page; }
    public void setPage(String page) { this.page = trimToNull(page); }
}