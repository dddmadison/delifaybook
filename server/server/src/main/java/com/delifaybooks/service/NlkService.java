// src/main/java/com/delifaybooks/service/NlkService.java
package com.delifaybooks.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;

@Service
public class NlkService {
  private final RestClient client;

  @Value("${nl.api.key}") private String key;
  @Value("${nl.api.holdings.base}") private String holdingsBase;
  @Value("${nl.api.isbn.base}") private String isbnBase;

  public NlkService(RestClient nlkRestClient){ this.client = nlkRestClient; }

  public String searchHoldings(String kwd, String srchTarget, Integer pageNum, Integer pageSize,
                               String systemType, String category, String sort, String order, String apiType) {

    var uri = UriComponentsBuilder
        .fromUriString(holdingsBase)
        .queryParam("key", key)
        .queryParam("apiType", (apiType==null||apiType.isBlank()) ? "json" : apiType)
        .queryParam("srchTarget", (srchTarget==null||srchTarget.isBlank()) ? "total" : srchTarget)
        .queryParam("kwd", kwd)
        .queryParam("pageSize", pageSize==null?10:pageSize)
        .queryParam("pageNum", pageNum==null?1:pageNum)
        .encode(StandardCharsets.UTF_8)
        .build()
        .toUri();

    return client.get()
        .uri(uri)
        .accept(MediaType.ALL)
        .retrieve()
        .body(String.class);
  }

  public String searchIsbn(String isbn, Integer pageNo, Integer pageSize, String resultStyle) {
    var uri = UriComponentsBuilder
        .fromUriString(isbnBase)
        .queryParam("cert_key", key)
        .queryParam("result_style", (resultStyle==null||resultStyle.isBlank()) ? "json" : resultStyle)
        .queryParam("page_no", pageNo==null?1:pageNo)
        .queryParam("page_size", pageSize==null?10:pageSize)
        .queryParam("isbn", isbn)
        .encode(StandardCharsets.UTF_8)
        .build()
        .toUri();

    return client.get()
        .uri(uri)
        .accept(MediaType.ALL)
        .retrieve()
        .body(String.class);
  }
}
