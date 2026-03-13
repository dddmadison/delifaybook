package com.delifaybook.server.global.util;

import com.delifaybook.server.global.error.ApiException;
import com.delifaybook.server.global.error.ErrorCode;

public final class IsbnNormalizer {

    private IsbnNormalizer() {}

    public static String normalize(String raw) {
        if (raw == null) return null;

        String s = raw.trim();
        if (s.isEmpty()) return s;

        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            // ✅ 숫자뿐만 아니라 'X'나 'x'도 허용해야 함 (ISBN-10 체크섬)
            if (Character.isDigit(c) || c == 'X' || c == 'x') {
                sb.append(Character.toUpperCase(c));
            }
        }
        return sb.toString();
    }

    public static String normalizeOrThrow(String raw) {
        String n = normalize(raw);

        if (n == null || n.isBlank()) {
            throw new ApiException(ErrorCode.ISBN_INVALID);
        }

        if (n.length() != 10 && n.length() != 13) {
            throw new ApiException(ErrorCode.ISBN_INVALID, "ISBN은 10자리 또는 13자리여야 합니다. (입력값: " + raw + ")");
        }

        return n;
    }
}