package com.delifaybook.server.api.notes;

import com.delifaybook.server.api.notes.dto.NoteCreateRequest;
import com.delifaybook.server.api.notes.dto.NoteResponse;
import com.delifaybook.server.domain.notes.NoteService;
import com.delifaybook.server.global.response.ApiResponse;
import com.delifaybook.server.global.util.IsbnNormalizer;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookshelf/{isbn}/notes")
public class NotesController {

    private final NoteService noteService;

    public NotesController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping
    public ApiResponse<List<NoteResponse>> list(@PathVariable String isbn) {
        String nIsbn = IsbnNormalizer.normalizeOrThrow(isbn);
        return ApiResponse.ok(noteService.listMyNotes(nIsbn));
    }

    // 옵션 A: 추가 후 "최신 notes 리스트" 반환
    @PostMapping
    public ApiResponse<List<NoteResponse>> add(
            @PathVariable String isbn,
            @Valid @RequestBody NoteCreateRequest request
    ) {
        String nIsbn = IsbnNormalizer.normalizeOrThrow(isbn);
        return ApiResponse.ok(noteService.addMyNoteAndReturnList(nIsbn, request.content()));
    }

    // 옵션 A: 삭제 후 "최신 notes 리스트" 반환
    @DeleteMapping("/{noteId}")
    public ApiResponse<List<NoteResponse>> delete(
            @PathVariable String isbn,
            @PathVariable Long noteId
    ) {
        String nIsbn = IsbnNormalizer.normalizeOrThrow(isbn);
        return ApiResponse.ok(noteService.deleteMyNoteAndReturnList(nIsbn, noteId));
    }
}
