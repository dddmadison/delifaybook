package com.delifaybook.server.domain.progress;

import com.delifaybook.server.domain.book.Book;
import com.delifaybook.server.domain.book.BookRepository;
import com.delifaybook.server.domain.bookshelf.Bookshelf;
import com.delifaybook.server.domain.bookshelf.BookshelfRepository;
import com.delifaybook.server.domain.bookshelf.BookshelfStatus;
import com.delifaybook.server.global.auth.CurrentUserProvider;
import com.delifaybook.server.global.error.ApiException;
import com.delifaybook.server.global.error.ErrorCode;
import com.delifaybook.server.global.util.IsbnNormalizer;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProgressService {

    private final ProgressRepository progressRepository;
    private final BookshelfRepository bookshelfRepository;
    private final BookRepository bookRepository;
    private final CurrentUserProvider currentUserProvider;

    public ProgressService(
            ProgressRepository progressRepository,
            BookshelfRepository bookshelfRepository,
            BookRepository bookRepository,
            CurrentUserProvider currentUserProvider
    ) {
        this.progressRepository = progressRepository;
        this.bookshelfRepository = bookshelfRepository;
        this.bookRepository = bookRepository;
        this.currentUserProvider = currentUserProvider;
    }

    public record ProgressSnapshot(int current, Integer total, String updatedAt) {}

    private Long requireUserId() {
        Long userId = currentUserProvider.getCurrentUserId();
        if (userId == null) throw new ApiException(ErrorCode.AUTH_REQUIRED);
        return userId;
    }

    // ✅ [수정] 헬퍼 메서드: custom- 아이디는 정규화 건너뛰기
    private String validateAndNormalizeIsbn(String rawIsbn) {
        if (rawIsbn == null || rawIsbn.isBlank()) {
            throw new ApiException(ErrorCode.INVALID_INPUT_VALUE);
        }
        if (rawIsbn.startsWith("custom-")) {
            return rawIsbn;
        }
        try {
            return IsbnNormalizer.normalizeOrThrow(rawIsbn);
        } catch (Exception e) {
            throw new ApiException(ErrorCode.INVALID_ISBN_FORMAT);
        }
    }

    public ProgressSnapshot updateMyProgress(String rawIsbn, int currentPage, Integer totalFromClient) {
        Long userId = requireUserId();
        if (userId == null) throw new ApiException(ErrorCode.AUTH_REQUIRED);
        
        // ✅ 안전한 정규화 사용
        String isbn = validateAndNormalizeIsbn(rawIsbn);

        // 1. 책장 조회
        Bookshelf bookshelf = bookshelfRepository.findByUserIdAndIsbn(userId, isbn)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOKSHELF_NOT_FOUND));

        // 2. 전체 페이지 결정 (서버 DB 우선)
        Integer resolvedTotal = resolveTotalPage(isbn, totalFromClient);
        validate(currentPage, resolvedTotal);

        // 3. Progress 저장 (수정: 선언되지 않은 totalPage 변수 대신 resolvedTotal 사용)
        Progress p = progressRepository.findByUserIdAndIsbn(userId, isbn).orElse(null);
        if (p == null) {
            p = new Progress(userId, isbn, currentPage, resolvedTotal);
        } else {
            p.setCurrentPage(currentPage);
            p.setTotalPage(resolvedTotal);
        }

        // ✅ [추가된 핵심 로직] 도서 메타데이터(Book)에 페이지 정보가 비어있다면, 
        // 유저가 모달에서 직접 입력한 전체 페이지 수를 Book 엔티티에 영구 저장합니다.
        bookRepository.findById(isbn).ifPresent(book -> {
            if (book.getItemPage() == null && resolvedTotal != null) {
                book.setItemPage(resolvedTotal);
                // 트랜잭션 내 더티 체킹이 발생하겠지만, 명시적으로 save를 호출해두어도 좋습니다.
                bookRepository.save(book);
            }
        });

        // ✅ [핵심 기능] 책장 상태 동기화 (읽는 중, 다 읽음 자동 처리)
        // (수정: 선언되지 않은 totalPage 변수 대신 resolvedTotal 사용)
        syncBookshelfStatus(bookshelf, currentPage, resolvedTotal);

        try {
            Progress saved = progressRepository.save(p);
            String updatedAt = (saved.getUpdatedAt() != null) ? saved.getUpdatedAt().toString() : null;
            return new ProgressSnapshot(saved.getCurrentPage(), saved.getTotalPage(), updatedAt);
        } catch (DataAccessException e) {
            throw new ApiException(ErrorCode.PROGRESS_SAVE_FAILED);
        }
    }

    private Integer resolveTotalPage(String isbn, Integer totalFromClient) {
        Integer fromBook = bookRepository.findById(isbn)
                .map(Book::getItemPage)
                .filter(v -> v != null && v >= 1)
                .orElse(null);

        if (fromBook != null) return fromBook;
        if (totalFromClient != null && totalFromClient >= 1 && totalFromClient <= 100000) {
            return totalFromClient;
        }
        return null;
    }

    // ✅ 상태 자동 변경 로직
    private void syncBookshelfStatus(Bookshelf shelf, int current, Integer total) {
        if (total != null && total > 0) {
            if (current >= total) {
                shelf.setStatus(BookshelfStatus.done); // 완독
            } else if (current > 0) {
                shelf.setStatus(BookshelfStatus.reading); // 읽는 중
            }
        } else if (current > 0) {
            // 전체 페이지를 몰라도 읽기 시작했으면 Reading
            if (shelf.getStatus() == BookshelfStatus.unread) {
                shelf.setStatus(BookshelfStatus.reading);
            }
        }
    }

    private void validate(int currentPage, Integer totalPage) {
        if (currentPage < 0) throw new ApiException(ErrorCode.PROGRESS_CURRENT_INVALID);
        if (totalPage != null) {
            if (totalPage < 1) throw new ApiException(ErrorCode.PROGRESS_TOTAL_INVALID);
            if (currentPage > totalPage) throw new ApiException(ErrorCode.PROGRESS_RANGE_INVALID);
        }
    }
}