package com.delifaybook.server.api.bookshelf.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateProgressRequest(
        @NotNull(message = "currentPage는 필수입니다.")
        @Min(value = 0, message = "currentPage는 0 이상이어야 합니다.")
        Integer currentPage,

        @Min(value = 0, message = "totalPage는 0 이상이어야 합니다.")
        Integer totalPage
) {}
