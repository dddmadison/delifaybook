// src/main/java/com/delifaybooks/service/ReadingLogService.java
package com.delifaybooks.service;

import com.delifaybooks.domain.Book;
import com.delifaybooks.domain.ReadingLog;
import com.delifaybooks.dto.ReadingLogReq;
import com.delifaybooks.repository.ReadingLogRepository;
import org.springframework.stereotype.Service;

@Service
public class ReadingLogService {
  private final ReadingLogRepository logs;
  private final BookService books;

  public ReadingLogService(ReadingLogRepository logs, BookService books){
    this.logs = logs;
    this.books = books;
  }

  public ReadingLog add(ReadingLogReq req){
    Book b = books.get(req.bookId());

    Integer total = b.getTotalPages();
    if (req.currentPage() != null && total != null && req.currentPage() > total) {
      throw new IllegalArgumentException("currentPage > totalPages");
    }

    ReadingLog log = new ReadingLog();
    log.setBook(b);
    log.setCurrentPage(req.currentPage());
    log.setNote(req.note());
    return logs.save(log);
  }
}
