package com.delifaybook.server.api.notes.dto;

import jakarta.validation.constraints.NotBlank;

public record NoteCreateRequest(
        @NotBlank(message = "content는 필수입니다.")
        String content
) {}
