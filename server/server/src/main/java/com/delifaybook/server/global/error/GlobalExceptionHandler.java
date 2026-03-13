package com.delifaybook.server.global.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApiException(ApiException e, HttpServletRequest req) {
        ErrorCode code = e.getErrorCode();

        String message = e.getMessage();
        if (message == null || message.trim().isEmpty()) {
            message = code.getDefaultMessage();
        }

        ApiError body = ApiError.of(
                code.name(),
                message,
                req.getRequestURI()
        );

        return ResponseEntity.status(code.getStatus()).body(body);
    }

    // DB 무결성/유니크 제약 위반 -> 409로 통일
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException e, HttpServletRequest req) {
        ApiError body = ApiError.of(
                ErrorCode.DATA_CONFLICT.name(),
                ErrorCode.DATA_CONFLICT.getDefaultMessage(),
                req.getRequestURI()
        );

        return ResponseEntity.status(ErrorCode.DATA_CONFLICT.getStatus()).body(body);
    }

    // @Validated 파라미터 검증 실패 (QueryParam/PathParam 등) -> 400으로 통일
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException e, HttpServletRequest req) {
        String message = (e.getMessage() == null || e.getMessage().trim().isEmpty())
                ? "요청 값이 올바르지 않습니다."
                : e.getMessage();

        ApiError body = ApiError.of(
                "VALIDATION_ERROR",
                message,
                req.getRequestURI()
        );

        return ResponseEntity.badRequest().body(body);
    }

    // 강제 규칙 제거: 더 이상 ISBN_INVALID로 몰아가지 않음 (최후방어 400)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException e, HttpServletRequest req) {
        String message = (e.getMessage() == null || e.getMessage().trim().isEmpty())
                ? "요청 값이 올바르지 않습니다."
                : e.getMessage();

        ApiError body = ApiError.of(
                "BAD_REQUEST",
                message,
                req.getRequestURI()
        );

        return ResponseEntity.badRequest().body(body);
    }

    // PathVariable 타입 변환 실패(예: noteId에 문자열 입력)도 500이 아니라 400으로 통일
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException e, HttpServletRequest req) {
        String name = e.getName();
        String message = (name == null || name.trim().isEmpty())
                ? "요청 값의 타입이 올바르지 않습니다."
                : name + " 값의 타입이 올바르지 않습니다.";

        ApiError body = ApiError.of(
                "BAD_REQUEST",
                message,
                req.getRequestURI()
        );

        return ResponseEntity.badRequest().body(body);
    }

    // 최후방어 404 (서비스는 ApiException으로 던지게 통일했지만 혹시 남아있을 수 있음)
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiError> handleNoSuchElement(NoSuchElementException e, HttpServletRequest req) {
        String message = (e.getMessage() == null || e.getMessage().trim().isEmpty())
                ? "리소스를 찾을 수 없습니다."
                : e.getMessage();

        ApiError body = ApiError.of(
                "NOT_FOUND",
                message,
                req.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    // @Valid 바인딩 실패도 우리 포맷으로 통일
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e, HttpServletRequest req) {
        String message = e.getBindingResult().getAllErrors().isEmpty()
                ? "요청 값이 올바르지 않습니다."
                : e.getBindingResult().getAllErrors().get(0).getDefaultMessage();

        ApiError body = ApiError.of(
                "VALIDATION_ERROR",
                message,
                req.getRequestURI()
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnknown(Exception e, HttpServletRequest req) {
        ApiError body = ApiError.of(
                "INTERNAL_ERROR",
                "서버 오류가 발생했습니다.",
                req.getRequestURI()
        );

        return ResponseEntity.internalServerError().body(body);
    }
}
