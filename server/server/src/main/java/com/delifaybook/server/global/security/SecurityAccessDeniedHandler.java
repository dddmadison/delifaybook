package com.delifaybook.server.global.security;

import com.delifaybook.server.global.error.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
public class SecurityAccessDeniedHandler implements AccessDeniedHandler {

    private final JsonMapper jsonMapper;

    public SecurityAccessDeniedHandler(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) {

        if (response.isCommitted()) return;

        ApiError body = ApiError.of(
                "ACCESS_DENIED",
                "권한이 없습니다.",
                request.getRequestURI()
        );

        try {
            try {
                response.resetBuffer();
            } catch (IllegalStateException ignore) {
            }

            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");

            jsonMapper.writeValue(response.getWriter(), body);

        } catch (Exception e) {
            try {
                if (!response.isCommitted()) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                }
            } catch (Exception ignore) {
            }
            // (선택) logger.warn(...)
        }
    }
}
