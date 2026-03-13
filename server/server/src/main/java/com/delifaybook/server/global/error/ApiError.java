package com.delifaybook.server.global.error;

import java.time.Instant;

public record ApiError(
     boolean success,
     String code,
     String message,
     String timestamp,
     String path
) {
 public static ApiError of(String code, String message, String path) {
     return new ApiError(false, code, message, Instant.now().toString(), path);
 }
}
