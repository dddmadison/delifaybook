// src/main/java/com/delifaybooks/web/NlkController.java
package com.delifaybooks.web;

import com.delifaybooks.service.NlkService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/kr/nl")
public class NlkController {

  private final NlkService nlk;

  public NlkController(NlkService nlk) {
    this.nlk = nlk;
  }

  @GetMapping("/search")
  public ResponseEntity<String> search(
      @RequestParam String kwd,
      @RequestParam(defaultValue = "1") Integer pageNum,
      @RequestParam(defaultValue = "10") Integer pageSize,
      @RequestParam(defaultValue = "total") String srchTarget,
      @RequestParam(required = false) String systemType,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String sort,
      @RequestParam(required = false) String order,
      @RequestParam(defaultValue = "json") String apiType
  ) {
    String body = nlk.searchHoldings(
        kwd, srchTarget, pageNum, pageSize, systemType, category, sort, order, apiType
    );
    return ResponseEntity.ok(body);
  }

  @GetMapping("/isbn")
  public ResponseEntity<String> isbn(
      @RequestParam String isbn,
      @RequestParam(defaultValue = "1") Integer pageNo,
      @RequestParam(defaultValue = "10") Integer pageSize,
      @RequestParam(defaultValue = "json") String resultStyle
  ) {
    String body = nlk.searchIsbn(isbn, pageNo, pageSize, resultStyle);
    return ResponseEntity.ok(body);
  }
}
