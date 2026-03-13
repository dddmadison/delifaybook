package com.delifaybook.server.global.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "nlk")
public class NlkApiProperties {

    private String baseUrl;
    private String certKey;
    private String resultStyle;
    
    // ✅ 기본값을 10으로 설정 (설정 파일에 없어도 동작하도록)
    private int pageSize = 10;

    public String getBaseUrl() {
        return baseUrl;
    }

    public String getCertKey() {
        return certKey;
    }

    public String getResultStyle() {
        return resultStyle;
    }

    public int getPageSize() {
        // 안전장치: 혹시 0 이하라면 10으로 강제
        return (pageSize <= 0) ? 10 : pageSize;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public void setCertKey(String certKey) {
        this.certKey = certKey;
    }

    public void setResultStyle(String resultStyle) {
        this.resultStyle = resultStyle;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }
}