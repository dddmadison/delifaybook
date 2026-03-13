package com.delifaybook.server.api.bookshelf.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddToBookshelfRequest(
        @NotBlank(message = "isbn은 필수입니다.")
        @Size(max = 50, message = "isbn은 50자 이하여야 합니다.") // custom- 길이를 고려해 50으로 증가 추천
        String isbn,

        @Size(max = 300, message = "title은 300자 이하여야 합니다.")
        String title,

        @Size(max = 200, message = "author는 200자 이하여야 합니다.")
        String author,

        @Size(max = 200, message = "publisher는 200자 이하여야 합니다.")
        String publisher,

        @Size(max = 50, message = "publishDate는 50자 이하여야 합니다.")
        String publishDate,

        @Size(max = 600, message = "coverUrl은 600자 이하여야 합니다.")
        String coverUrl
) { }