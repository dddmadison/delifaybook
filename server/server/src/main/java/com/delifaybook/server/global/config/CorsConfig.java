// CorsConfig.java
package com.delifaybook.server.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    // 쉼표로 여러 도메인 허용 가능 (dev/prod 환경변수로 분리)
    @Value("#{'${app.cors.allowed-origins:http://localhost:3000}'.split(',')}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true) // 세션 쿠키(withCredentials) 사용 시 필수
                .maxAge(3600);
    }
}