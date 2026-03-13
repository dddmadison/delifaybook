package com.delifaybook.server.global.response;

import java.time.Instant;

public record ApiResponse<T>(
        boolean success,
        T data,
        String code,
        String message,
        String timestamp
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, Instant.now().toString());
    }

    public static <T> ApiResponse<T> fail(String code, String message) {
        return new ApiResponse<>(false, null, code, message, Instant.now().toString());
    }
}
