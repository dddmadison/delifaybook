package com.delifaybook.server.global.external.nlk;

import com.delifaybook.server.global.config.NlkApiProperties;
import com.delifaybook.server.global.external.nlk.dto.NlkBookDoc;
import com.delifaybook.server.global.external.nlk.dto.NlkLookupResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class NlkClient {

    private static final Logger log = LoggerFactory.getLogger(NlkClient.class);

    private final NlkApi nlkApi; // ✅ RestClient 대신 NlkApi 인터페이스 주입
    private final NlkApiProperties props;

    public NlkClient(NlkApi nlkApi, NlkApiProperties props) {
        this.nlkApi = nlkApi;
        this.props = props;
    }

    // ISBN 단건 조회
    public Optional<NlkBookDoc> lookupByIsbn(String normalizedIsbn) {
        try {
            // ✅ 복잡한 URI 빌더 제거!
            NlkLookupResponse response = nlkApi.search(
                    props.getCertKey(), props.getResultStyle(), 1, 10, null, normalizedIsbn
            );

            if (response != null && !response.hasError() && response.getDocs() != null && !response.getDocs().isEmpty()) {
                return Optional.of(response.getDocs().get(0));
            }
        } catch (Exception e) {
            log.warn("NLK API lookup failed for ISBN: {}. Error: {}", normalizedIsbn, e.getMessage());
        }
        return Optional.empty();
    }

    private int clampPageSize(int s) {
        if (s <= 0) s = 10;
        if (s > 100) s = 100;
        return s;
    }

    // 제목 기반 검색
    public NlkLookupResponse searchByKeyword(String keyword, int page, int size) {
        if (keyword == null || keyword.isBlank()) {
            return new NlkLookupResponse();
        }

        int pageSize = clampPageSize(size);
        int pageNo = (page <= 0) ? 1 : page;

        try {
            // ✅ 복잡한 URI 빌더 제거!
            return nlkApi.search(
                    props.getCertKey(), props.getResultStyle(), pageNo, pageSize, keyword, null
            );
        } catch (Exception e) {
            log.error("NLK Search Failed. keyword={}, page={}, size={}, error={}",
                    keyword, pageNo, pageSize, e.getMessage(), e);
            return new NlkLookupResponse();
        }
    }
}