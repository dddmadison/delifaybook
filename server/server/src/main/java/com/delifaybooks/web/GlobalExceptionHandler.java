// src/main/java/com/delifaybooks/web/GlobalExceptionHandler.java
package com.delifaybooks.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  record ErrorBody(String code, String message) {}

  @ExceptionHandler(NoSuchElementException.class)
  public ResponseEntity<ErrorBody> handleNoSuch(NoSuchElementException e){
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(new ErrorBody("NOT_FOUND", e.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorBody> handleValidation(MethodArgumentNotValidException e){
    String msg = e.getBindingResult().getFieldErrors().stream()
        .map(fe -> fe.getField() + " " + fe.getDefaultMessage())
        .findFirst().orElse("validation error");
    return ResponseEntity.badRequest().body(new ErrorBody("BAD_REQUEST", msg));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorBody> handleIllegal(IllegalArgumentException e){
    return ResponseEntity.badRequest().body(new ErrorBody("BAD_REQUEST", e.getMessage()));
  }
}
