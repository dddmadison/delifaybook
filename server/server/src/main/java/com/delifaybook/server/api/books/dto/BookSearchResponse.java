package com.delifaybook.server.api.books.dto;

import java.util.List;

// ✅ 페이지네이션 정보를 포함한 검색 결과 응답
public record BookSearchResponse(
        int page,           // 현재 페이지 번호
        int size,           // 페이지 당 개수
        long totalCount,    // 전체 검색 결과 수
        boolean isLast,     // 마지막 페이지 여부
        List<BookLookupResponse> items // 실제 책 목록
		) {
    public static BookSearchResponse of(int page, int size, long totalCount, List<BookLookupResponse> items) {
        boolean isLast = (totalCount == 0) || ((long) page * size >= totalCount);
        return new BookSearchResponse(page, size, totalCount, isLast, items);
    }
}