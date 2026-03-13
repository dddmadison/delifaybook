package com.delifaybook.server.global.external.nlk.dto;

import java.util.List;
import java.util.Optional;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class NlkLookupResponse {

    @JsonProperty("PAGE_NO")
    private String pageNo;

    @JsonProperty("TOTAL_COUNT")
    private String totalCount;

    @JsonProperty("docs")
    @JsonAlias({ "DOC", "DOCS", "DATA", "ITEMS", "items", "result" })
    private List<NlkBookDoc> docs;

    @JsonProperty("ERROR_CODE")
    @JsonAlias({ "error_code", "err_code", "ERR_CODE" })
    private String errorCode;

    @JsonProperty("ERROR_MESSAGE")
    @JsonAlias({ "error_message", "err_message", "ERR_MESSAGE", "MESSAGE", "message" })
    private String errorMessage;

    public String getPageNo() { return pageNo; }
    public String getTotalCount() { return totalCount; }
    public List<NlkBookDoc> getDocs() { return docs; }
    public String getErrorCode() { return errorCode; }
    public String getErrorMessage() { return errorMessage; }

    public boolean hasError() {
        return errorCode != null && !errorCode.trim().isEmpty();
    }

    public Optional<NlkBookDoc> firstDoc() {
        if (docs == null || docs.isEmpty()) return Optional.empty();
        return Optional.ofNullable(docs.get(0));
    }
}
