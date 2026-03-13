package com.delifaybook.server.api.notes.dto;

public record NoteResponse(
        Long id,
        String isbn,
        String content,
        String createdAt,
        String updatedAt
) {}
