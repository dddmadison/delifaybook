package com.delifaybook.server.global.security;

import com.delifaybook.server.global.error.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;

@Component
public class SecurityAuthEntryPoint implements AuthenticationEntryPoint {

    private final JsonMapper jsonMapper;

    public SecurityAuthEntryPoint(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) {

        // 이미 커밋되었으면 더 건드리면 오히려 예외가 나며 500으로 튈 수 있음
        if (response.isCommitted()) return;

        ApiError body = ApiError.of(
                "AUTH_REQUIRED",
                "로그인이 필요합니다.",
                request.getRequestURI()
        );

        try {
            // 혹시 이전에 뭔가 써졌다면 버퍼만 초기화(헤더/상태 유지 가능)
            try {
                response.resetBuffer();
            } catch (IllegalStateException ignore) {
                // resetBuffer가 불가능한 상태면 그냥 진행
            }

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");

            jsonMapper.writeValue(response.getWriter(), body);
            // flushBuffer는 선택(커밋을 확실히 하고 싶으면 사용)
            // response.flushBuffer();

        } catch (Exception e) {
            // ✅ 여기서 예외를 다시 던지면 "보안 흐름 → 500"으로 튈 수 있으니 절대 던지지 않음
            // 바디 못 쓰면 그냥 상태코드만이라도 유지하고 종료
            try {
                if (!response.isCommitted()) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                }
            } catch (Exception ignore) {
                // ignore
            }
            // (선택) 로그만 남기기. logger가 있다면 logger.warn(...)
        }
    }
}
