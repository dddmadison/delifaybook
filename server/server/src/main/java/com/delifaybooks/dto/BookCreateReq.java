// src/main/java/com/delifaybooks/dto/BookCreateReq.java
package com.delifaybooks.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record BookCreateReq(
    @NotBlank String title,
    String author,
    String publisher,
    @Min(1) @NotNull Integer totalPages,
    List<String> tags
) {}
