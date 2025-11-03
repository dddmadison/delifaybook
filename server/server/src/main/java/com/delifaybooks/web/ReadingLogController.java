// src/main/java/com/delifaybooks/web/ReadingLogController.java
package com.delifaybooks.web;

import com.delifaybooks.domain.ReadingLog;
import com.delifaybooks.dto.ReadingLogReq;
import com.delifaybooks.service.ReadingLogService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/logs")
public class ReadingLogController {
  private final ReadingLogService service;
  public ReadingLogController(ReadingLogService service){ this.service = service; }

  @PostMapping
  public ReadingLog add(@Valid @RequestBody ReadingLogReq req){
    return service.add(req);
  }
}
