package com.delifaybook.server.global.external.nlk;

import com.delifaybook.server.global.external.nlk.dto.NlkLookupResponse;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;

public interface NlkApi {
    // @GetExchange를 통해 파라미터를 선언적으로 매핑합니다.
    @GetExchange
    NlkLookupResponse search(
            @RequestParam("cert_key") String certKey,
            @RequestParam("result_style") String resultStyle,
            @RequestParam("page_no") int pageNo,
            @RequestParam("page_size") int pageSize,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "isbn", required = false) String isbn
    );
}