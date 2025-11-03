// src/main/java/com/delifaybooks/config/RestClientConfig.java
package com.delifaybooks.config;

import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.util.TimeValue;
import org.apache.hc.core5.util.Timeout;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

  @Bean
  public RestClient nlkRestClient() {
    RequestConfig requestConfig = RequestConfig.custom()
        .setConnectTimeout(Timeout.ofSeconds(5))
        .setResponseTimeout(Timeout.ofSeconds(10))
        .build();

    CloseableHttpClient httpClient = HttpClients.custom()
        .setDefaultRequestConfig(requestConfig)
        .disableCookieManagement()
        .evictExpiredConnections()
        .evictIdleConnections(TimeValue.ofSeconds(30))
        .build();

    HttpComponentsClientHttpRequestFactory factory =
        new HttpComponentsClientHttpRequestFactory(httpClient);

    return RestClient.builder()
        .requestFactory(factory)
        .defaultHeader("Accept-Encoding", "gzip")
        .build();
  }
}
