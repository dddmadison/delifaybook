package com.delifaybook.server.domain.notes;

import com.delifaybook.server.api.notes.dto.NoteResponse;
import com.delifaybook.server.domain.book.BookRepository;
import com.delifaybook.server.domain.bookshelf.BookshelfRepository;
import com.delifaybook.server.global.auth.CurrentUserProvider;
import com.delifaybook.server.global.error.ApiException;
import com.delifaybook.server.global.error.ErrorCode;
import com.delifaybook.server.global.util.IsbnNormalizer;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NoteService {

    private final NoteRepository noteRepository;
    private final BookshelfRepository bookshelfRepository;
    private final BookRepository bookRepository;
    private final CurrentUserProvider currentUserProvider;
    private final EntityManager entityManager;

    public NoteService(
            NoteRepository noteRepository,
            BookshelfRepository bookshelfRepository,
            BookRepository bookRepository,
            CurrentUserProvider currentUserProvider,
            EntityManager entityManager
    ) {
        this.noteRepository = noteRepository;
        this.bookshelfRepository = bookshelfRepository;
        this.bookRepository = bookRepository;
        this.currentUserProvider = currentUserProvider;
        this.entityManager = entityManager;
    }

    private Long requireUserId() {
        Long userId = currentUserProvider.getCurrentUserId();
        if (userId == null) throw new ApiException(ErrorCode.AUTH_REQUIRED);
        return userId;
    }

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

    @Transactional(readOnly = true)
    public List<NoteResponse> listMyNotes(String rawIsbn) {
        Long userId = requireUserId();
        String isbn = validateAndNormalizeIsbn(rawIsbn);

        if (!bookshelfRepository.existsByUserIdAndIsbn(userId, isbn)) {
            throw new ApiException(ErrorCode.BOOKSHELF_NOT_FOUND);
        }

        return noteRepository.findAllByUserIdAndIsbnOrderByCreatedAtDesc(userId, isbn)
                .stream()
                .map(NoteService::toResponse)
                .toList();
    }

    public List<NoteResponse> addMyNoteAndReturnList(String rawIsbn, String content) {
        Long userId = requireUserId();
        String isbn = validateAndNormalizeIsbn(rawIsbn);

        String text = (content == null) ? "" : content.trim();
        if (text.isEmpty()) {
            throw new ApiException(ErrorCode.NOTE_INVALID);
        }

        if (!bookRepository.existsByIsbn(isbn)) {
            throw new ApiException(ErrorCode.BOOK_NOT_FOUND);
        }

        if (!bookshelfRepository.existsByUserIdAndIsbn(userId, isbn)) {
            throw new ApiException(ErrorCode.BOOKSHELF_NOT_FOUND);
        }

        Note note = new Note(userId, isbn, text);
        noteRepository.save(note);

        // 핵심: DB가 자동 생성한 created_at / updated_at 값을
        // 다음 조회에서 확실히 다시 읽어오도록 flush + clear
        entityManager.flush();
        entityManager.clear();

        return noteRepository.findAllByUserIdAndIsbnOrderByCreatedAtDesc(userId, isbn)
                .stream()
                .map(NoteService::toResponse)
                .toList();
    }

    public List<NoteResponse> deleteMyNoteAndReturnList(String rawIsbn, Long noteId) {
        Long userId = requireUserId();
        String isbn = validateAndNormalizeIsbn(rawIsbn);

        if (noteId == null) {
            throw new ApiException(ErrorCode.NOTE_INVALID);
        }

        Note note = noteRepository.findByUserIdAndIsbnAndId(userId, isbn, noteId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOTE_NOT_FOUND));

        noteRepository.delete(note);

        // 삭제 후에도 영속성 컨텍스트를 비워서 최신 상태 재조회
        entityManager.flush();
        entityManager.clear();

        return noteRepository.findAllByUserIdAndIsbnOrderByCreatedAtDesc(userId, isbn)
                .stream()
                .map(NoteService::toResponse)
                .toList();
    }

    private static NoteResponse toResponse(Note n) {
        String createdAt = (n.getCreatedAt() != null) ? n.getCreatedAt().toString() : null;
        String updatedAt = (n.getUpdatedAt() != null) ? n.getUpdatedAt().toString() : createdAt;

        return new NoteResponse(
                n.getId(),
                n.getIsbn(),
                n.getContent(),
                createdAt,
                updatedAt
        );
    }
}