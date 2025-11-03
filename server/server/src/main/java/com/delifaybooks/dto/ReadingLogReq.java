// src/main/java/com/delifaybooks/dto/ReadingLogReq.java
package com.delifaybooks.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReadingLogReq(
    @NotNull Long bookId,
    @NotNull @Min(0) Integer currentPage,
    String note
) {}
