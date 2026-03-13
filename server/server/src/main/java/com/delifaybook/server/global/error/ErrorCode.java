package com.delifaybook.server.global.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // 401/403
    AUTH_REQUIRED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "권한이 없습니다."),

    // 400
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."), // 추가
    INVALID_ISBN_FORMAT(HttpStatus.BAD_REQUEST, "유효하지 않은 ISBN 형식입니다."), // 추가
    ISBN_INVALID(HttpStatus.BAD_REQUEST, "ISBN이 올바르지 않습니다."),
    PROGRESS_INVALID(HttpStatus.BAD_REQUEST, "진행도 값이 올바르지 않습니다."),
    PROGRESS_CURRENT_INVALID(HttpStatus.BAD_REQUEST, "현재 페이지는 0보다 작을 수 없습니다."),
    PROGRESS_TOTAL_INVALID(HttpStatus.BAD_REQUEST, "전체 페이지는 1보다 작을 수 없습니다."),
    PROGRESS_RANGE_INVALID(HttpStatus.BAD_REQUEST, "현재 페이지가 전체 페이지보다 클 수 없습니다."),
    NOTE_INVALID(HttpStatus.BAD_REQUEST, "메모 값이 올바르지 않습니다."),

    // 404
    BOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "책을 찾을 수 없습니다."),
    BOOK_NOT_FOUND_EXTERNAL(HttpStatus.NOT_FOUND, "책 정보를 찾을 수 없으며, 수동 입력 정보도 부족합니다."), // 추가
    BOOKSHELF_NOT_FOUND(HttpStatus.NOT_FOUND, "책장에 없는 책입니다. 먼저 책장에 추가하세요."),
    NOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "메모를 찾을 수 없습니다."),

    // 409
    DATA_CONFLICT(HttpStatus.CONFLICT, "이미 존재하거나 제약 조건에 위배된 요청입니다."),
    ALREADY_EXIST_BOOKSHELF(HttpStatus.CONFLICT, "이미 서재에 등록된 도서입니다."), // 추가

 // 500
    PROGRESS_SAVE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "진행도 저장 중 오류가 발생했습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),
	
    // 502/503
    NLK_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "NLK 서비스가 일시적으로 응답하지 않습니다."),
    NLK_BAD_RESPONSE(HttpStatus.BAD_GATEWAY, "NLK 응답이 올바르지 않습니다.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() { return status; }
    public String getDefaultMessage() { return defaultMessage; }
}