package com.delifaybook.server.domain.bookshelf;

import com.delifaybook.server.api.bookshelf.dto.AddToBookshelfRequest;
import com.delifaybook.server.domain.book.Book;
import com.delifaybook.server.domain.book.BookRepository;
import com.delifaybook.server.domain.book.BookService;
import com.delifaybook.server.domain.notes.NoteRepository;
import com.delifaybook.server.domain.progress.Progress;
import com.delifaybook.server.domain.progress.ProgressRepository;
import com.delifaybook.server.global.auth.CurrentUserProvider;
import com.delifaybook.server.global.error.ApiException;
import com.delifaybook.server.global.error.ErrorCode;
import com.delifaybook.server.global.util.IsbnNormalizer;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookshelfService {

    private final BookshelfRepository bookshelfRepository;
    private final BookRepository bookRepository;
    private final ProgressRepository progressRepository;
    private final NoteRepository noteRepository;
    private final CurrentUserProvider currentUserProvider;
    private final BookService bookService;

    public BookshelfService(
            BookshelfRepository bookshelfRepository,
            BookRepository bookRepository,
            ProgressRepository progressRepository,
            NoteRepository noteRepository,
            CurrentUserProvider currentUserProvider,
            BookService bookService
    ) {
        this.bookshelfRepository = bookshelfRepository;
        this.bookRepository = bookRepository;
        this.progressRepository = progressRepository;
        this.noteRepository = noteRepository;
        this.currentUserProvider = currentUserProvider;
        this.bookService = bookService;
    }

    // DTO (Inner Record)
    public record ProgressSnapshot(int current, Integer total, String updatedAt) {}

    public record BookshelfItemSnapshot(
            String isbn,
            String title,
            String author,
            String publisher,
            String coverUrl,
            String publishDate,
            Integer itemPage,
            String status,
            List<String> tags,
            ProgressSnapshot progress
    ) {}

    private Long requireUserId() {
        Long userId = currentUserProvider.getCurrentUserId();
        if (userId == null) throw new ApiException(ErrorCode.AUTH_REQUIRED);
        return userId;
    }

    // 서재 목록 조회
    @Transactional(readOnly = true)
    public List<BookshelfItemSnapshot> listMyBookshelf() {
        Long userId = requireUserId();

        List<Bookshelf> shelfRows = bookshelfRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        if (shelfRows.isEmpty()) return List.of();

        List<String> isbns = shelfRows.stream().map(Bookshelf::getIsbn).toList();
        
        Map<String, Book> bookMap = bookRepository.findAllByIsbnIn(isbns).stream()
                .collect(Collectors.toMap(Book::getIsbn, b -> b, (a, b) -> a));
        
        Map<String, Progress> progressMap = progressRepository.findAllByUserIdAndIsbnIn(userId, isbns).stream()
                .collect(Collectors.toMap(Progress::getIsbn, p -> p, (a, b) -> a));

        return shelfRows.stream()
                .map(row -> toSnapshot(row, bookMap.get(row.getIsbn()), progressMap.get(row.getIsbn())))
                .toList();
    }

    // 단건 조회
    @Transactional(readOnly = true)
    public BookshelfItemSnapshot getMyBookshelfItem(String rawIsbn) {
        Long userId = requireUserId();
        // ✅ 조회 시에도 안전한 정규화 사용 (형식 틀리면 400 에러)
        String isbn = validateAndNormalizeIsbn(rawIsbn); 

        Bookshelf shelf = bookshelfRepository.findByUserIdAndIsbn(userId, isbn)
                .orElseThrow(() -> new ApiException(ErrorCode.BOOKSHELF_NOT_FOUND));

        Book book = bookRepository.findByIsbn(isbn).orElse(null);
        
        if (book == null && !isbn.startsWith("custom-")) {
            try { book = bookService.lookupAndUpsertByIsbn(isbn); } catch (Exception ignored) {}
        }

        Progress prog = progressRepository.findByUserIdAndIsbn(userId, isbn).orElse(null);
        return toSnapshot(shelf, book, prog);
    }

    // ✅ [수정 완료] 책 추가 (반환타입: String, 예외 발생 로직 강화)
    public String addToMyBookshelf(AddToBookshelfRequest req) {
        Long userId = requireUserId();
        
        // 1. ISBN 검증 및 정규화
        String isbn = validateAndNormalizeIsbn(req.isbn());

        // 2. 이미 서재에 있는지 확인 (409 Conflict 발생)
        if (bookshelfRepository.existsByUserIdAndIsbn(userId, isbn)) {
            throw new ApiException(ErrorCode.ALREADY_EXIST_BOOKSHELF);
        }

        // 3. books 테이블에 책 정보 확보 (없으면 추가)
        if (!bookRepository.existsByIsbn(isbn)) {
            ensureBookExists(isbn, req);
        }

        // 4. bookshelf 테이블에 저장
        try {
            bookshelfRepository.save(new Bookshelf(userId, isbn));
            return isbn; // ✅ 최종 저장된 정규화 ISBN 반환
        } catch (DataIntegrityViolationException e) {
            // 동시성 이슈로 인한 중복 발생 시
            throw new ApiException(ErrorCode.ALREADY_EXIST_BOOKSHELF);
        }
    }

    // 🛠️ 내부 로직: 책 정보 확보 (실패 시 예외 발생으로 흐름 중단)
    private void ensureBookExists(String isbn, AddToBookshelfRequest req) {
        // Case A: 커스텀 ID -> 수동 저장
        if (isbn.startsWith("custom-")) {
            saveManualBook(isbn, req);
            return;
        }

        // Case B: 일반 ISBN -> 외부 조회 시도
        try {
            bookService.lookupAndUpsertByIsbn(isbn);
        } catch (Exception e) {
            // Case C: 외부 조회 실패 시 -> 수동 정보 확인
            if (req.title() != null && !req.title().isBlank()) {
                saveManualBook(isbn, req);
            } else {
                // 🛑 정보도 없고 조회도 안되면 예외 발생 (FK 에러 방지)
                throw new ApiException(ErrorCode.BOOK_NOT_FOUND_EXTERNAL);
            }
        }
    }

    // 🛠️ 수동 저장 (saveAndFlush로 FK 참조 무결성 보장)
    private void saveManualBook(String isbn, AddToBookshelfRequest req) {
        Book manualBook = new Book(
            isbn,
            req.title() != null ? req.title() : "제목 없음",
            req.author() != null ? req.author() : "저자 미상",
            req.publisher(),
            req.publishDate(),
            req.coverUrl()
        );
        // books 테이블에 즉시 반영
        bookRepository.saveAndFlush(manualBook);
    }

    // 🛠️ 삭제
    public void removeFromMyBookshelf(String rawIsbn) {
        Long userId = requireUserId();
        String isbn = validateAndNormalizeIsbn(rawIsbn);

        if (!bookshelfRepository.existsByUserIdAndIsbn(userId, isbn)) {
            throw new ApiException(ErrorCode.BOOKSHELF_NOT_FOUND);
        }

        progressRepository.deleteByUserIdAndIsbn(userId, isbn);
        noteRepository.deleteAllByUserIdAndIsbn(userId, isbn);
        bookshelfRepository.deleteByUserIdAndIsbn(userId, isbn);
    }

    // 🛠️ 헬퍼: ISBN 검증 및 정규화
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
            // 실패 시 원본 반환이 아니라 400 에러 발생
            throw new ApiException(ErrorCode.INVALID_ISBN_FORMAT);
        }
    }

    // ... (toSnapshot, parseTags 메서드는 기존과 동일) ...
    private BookshelfItemSnapshot toSnapshot(Bookshelf shelf, Book book, Progress prog) {
        Integer itemPage = (book != null) ? book.getItemPage() : null;
        ProgressSnapshot pSnap = null;
        if (prog != null) {
            Integer displayTotal = (itemPage != null) ? itemPage : prog.getTotalPage();
            String updated = (prog.getUpdatedAt() != null) ? prog.getUpdatedAt().toString() : null;
            pSnap = new ProgressSnapshot(prog.getCurrentPage(), displayTotal, updated);
        }
        String status = (shelf.getStatus() != null) ? shelf.getStatus().name().toLowerCase() : "unread";
        List<String> tags = parseTags(shelf.getTagsJson());
        return new BookshelfItemSnapshot(
                shelf.getIsbn(),
                book != null ? book.getTitle() : "",
                book != null ? book.getAuthor() : "",
                book != null ? book.getPublisher() : "",
                book != null ? book.getCoverUrl() : null,
                book != null ? book.getPublishDate() : null,
                itemPage,
                status,
                tags,
                pSnap
        );
    }

    private List<String> parseTags(String json) {
        if (json == null || json.equals("[]")) return List.of();
        return Arrays.stream(json.replace("[", "").replace("]", "").replace("\"", "").split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}