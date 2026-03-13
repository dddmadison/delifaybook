package com.delifaybook.server.api.bookshelf;

import com.delifaybook.server.api.bookshelf.dto.AddToBookshelfRequest;
import com.delifaybook.server.api.bookshelf.dto.UpdateProgressRequest;
import com.delifaybook.server.domain.bookshelf.BookshelfService;
import com.delifaybook.server.domain.progress.ProgressService;
import com.delifaybook.server.global.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/bookshelf")
public class BookshelfController {

    private final BookshelfService bookshelfService;
    private final ProgressService progressService;

    public BookshelfController(BookshelfService bookshelfService, ProgressService progressService) {
        this.bookshelfService = bookshelfService;
        this.progressService = progressService;
    }

    @GetMapping
    public ApiResponse<?> getMyBookshelf() {
        return ApiResponse.ok(bookshelfService.listMyBookshelf());
    }

    @PostMapping
    public ApiResponse<?> addBook(@RequestBody @Valid AddToBookshelfRequest req) {
        // ✅ 서비스가 반환한 '저장된 ISBN'을 받음 (String 타입)
        String savedIsbn = bookshelfService.addToMyBookshelf(req);
        
        // 응답에 요청한 ISBN이 아니라, 실제 저장된(정규화된) ISBN을 반환해야 함
        return ApiResponse.ok(Map.of("created", true, "isbn", savedIsbn));
    }

    @DeleteMapping("/{isbn}")
    public ApiResponse<?> removeBook(@PathVariable String isbn) {
        bookshelfService.removeFromMyBookshelf(isbn);
        return ApiResponse.ok(Map.of("deleted", true, "isbn", isbn));
    }

    @PatchMapping("/{isbn}/progress")
    public ApiResponse<?> patchProgress(
            @PathVariable String isbn,
            @Valid @RequestBody UpdateProgressRequest req
    ) {
        int current = req.currentPage();
        Integer total = req.totalPage();

        progressService.updateMyProgress(isbn, current, total);
        return ApiResponse.ok(bookshelfService.getMyBookshelfItem(isbn));
    }
}