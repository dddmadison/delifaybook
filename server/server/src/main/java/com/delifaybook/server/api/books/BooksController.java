package com.delifaybook.server.api.books;

import com.delifaybook.server.api.books.dto.BookLookupResponse;
import com.delifaybook.server.api.books.dto.BookSearchResponse;
import com.delifaybook.server.domain.book.Book;
import com.delifaybook.server.domain.book.BookService;
import com.delifaybook.server.global.external.nlk.dto.NlkLookupResponse;
import com.delifaybook.server.global.response.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.delifaybook.server.domain.book.AiCoverService;

import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BooksController {

    private final BookService bookService;
    
    private final AiCoverService aiCoverService;

    public BooksController(BookService bookService, AiCoverService aiCoverService) {
        this.bookService = bookService;
        this.aiCoverService = aiCoverService;
    }
    
    @PostMapping("/{isbn}/cover/ai")
    public ApiResponse<String> generateAiCover(
            @PathVariable String isbn,
            @RequestParam("file") MultipartFile file) {
        String newCoverUrl = aiCoverService.generateAndSaveCover(isbn, file);
        return ApiResponse.ok(newCoverUrl);
    }

    @GetMapping("/lookup")
    public ApiResponse<BookLookupResponse> lookup(@RequestParam String isbn) {
        Book book = bookService.lookupAndUpsertByIsbn(isbn);
        return ApiResponse.ok(BookLookupResponse.from(book));
    }

    @GetMapping("/search")
    public ApiResponse<BookSearchResponse> search(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        String keyword = (q == null) ? "" : q.trim();
        if (keyword.isEmpty()) {
            return ApiResponse.ok(BookSearchResponse.of(page, size, 0, List.of()));
        }

        // 1. ISBN 검색 시도
        if (keyword.matches("^[0-9X-]{10,17}$")) {
            try {
                Book book = bookService.lookupAndUpsertByIsbn(keyword);
                return ApiResponse.ok(BookSearchResponse.of(1, size, 1, List.of(BookLookupResponse.from(book))));
            } catch (Exception ignored) {}
        }

        // 2. NLK 검색 실행
        NlkLookupResponse nlkRes = bookService.search(keyword, page, size);

        // 3. 변환 (DTO 매핑)
        List<BookLookupResponse> items = nlkRes.getDocs().stream()
                .map(doc -> {
                    BookLookupResponse r = new BookLookupResponse();
                    r.setIsbn(doc.getIsbn());
                    r.setTitle(doc.getTitle());
                    r.setAuthor(doc.getAuthor());
                    r.setPublisher(doc.getPublisher());
                    r.setCoverUrl(doc.getCoverUrl());
                    r.setPublishDate(doc.getPubDate());
                    // 목록 조회 시엔 페이지 정보를 굳이 파싱하지 않거나 null로 둠 (상세 조회 시 확보됨)
                    r.setItemPage(null); 
                    return r;
                })
                .toList();

        // ✅ [수정 완료] String -> long 안전 변환 로직 추가
        long totalCount = 0;
        try {
            String tc = nlkRes.getTotalCount();
            if (tc != null && !tc.isBlank()) {
                totalCount = Long.parseLong(tc);
            }
        } catch (NumberFormatException ignored) {}

        return ApiResponse.ok(BookSearchResponse.of(page, size, totalCount, items));
    }
}