// src/main/java/com/delifaybooks/config/CorsConfig.java
package com.delifaybooks.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Value("${app.cors-allowed-origins}") private String origins;

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins(origins.split(","))
        .allowedMethods("GET","POST","PATCH","PUT","DELETE","OPTIONS")
        .allowedHeaders("*")
        .exposedHeaders("Content-Type","Content-Length")
        .allowCredentials(true);
  }
}
