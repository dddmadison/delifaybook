// src/main/java/com/delifaybooks/dto/BookStatusPatchReq.java
package com.delifaybooks.dto;

import com.delifaybooks.domain.Book;
import jakarta.validation.constraints.NotNull;

public record BookStatusPatchReq(
    @NotNull Book.Status status
) {}
