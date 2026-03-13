package com.delifaybook.server.global.config;

import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.cfg.DateTimeFeature;

@Configuration
public class JacksonConfig {

    @Bean
    public JsonMapperBuilderCustomizer jsonMapperBuilderCustomizer() {
        return builder -> builder
                .disable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS)
                .disable(DateTimeFeature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE)
                // 필요할 때만: ZonedDateTime 등에 [Asia/Seoul] 같은 ZoneId까지 붙여서 내보내고 싶으면 enable
                // .enable(DateTimeFeature.WRITE_DATES_WITH_ZONE_ID)
                // 굳이 안 쓰면 이 줄 자체를 삭제해도 됨 (기본값이 false인 케이스가 많음)
                .disable(DateTimeFeature.WRITE_DATES_WITH_ZONE_ID);
    }
}
