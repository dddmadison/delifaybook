package com.delifaybook.server.global.config;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

// ✅ 아래 3개의 import 구문이 반드시 추가되어야 합니다!
import com.delifaybook.server.global.external.nlk.NlkApi;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class HttpClientConfig {

    /**
     * NLK 전용 타임아웃 설정
     * - connectTimeout: TCP 연결 제한
     * - readTimeout: 응답 수신 제한
     */
    @Bean(name = "nlkRequestFactory")
    public ClientHttpRequestFactory nlkRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(3).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(5).toMillis());
        return factory;
    }

    /**
     * NLK 전용 RestClient (Bean 이름 분리)
     */
    @Bean(name = "nlkRestClient")
    public RestClient nlkRestClient(
            NlkApiProperties nlkApiProperties,
            @Qualifier("nlkRequestFactory") ClientHttpRequestFactory requestFactory
    ) {
        return RestClient.builder()
                .baseUrl(nlkApiProperties.getBaseUrl())
                .requestFactory(requestFactory)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
    
    @Bean
    public NlkApi nlkApi(@Qualifier("nlkRestClient") RestClient restClient) {
        RestClientAdapter adapter = RestClientAdapter.create(restClient);
        HttpServiceProxyFactory factory = HttpServiceProxyFactory.builderFor(adapter).build();
        return factory.createClient(NlkApi.class);
    }
}