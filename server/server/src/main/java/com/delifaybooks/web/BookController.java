// src/main/java/com/delifaybooks/web/BookController.java
package com.delifaybooks.web;

import com.delifaybooks.domain.Book;
import com.delifaybooks.dto.BookCreateReq;
import com.delifaybooks.dto.BookStatusPatchReq;
import com.delifaybooks.service.BookService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {
  private final BookService bookService;
  public BookController(BookService bookService){ this.bookService = bookService; }

  @GetMapping
  public List<Book> list(@RequestParam(required = false) String q){
    return bookService.list(q);
  }

  @GetMapping("/{id}")
  public Book get(@PathVariable Long id){
    return bookService.get(id);
  }

  @PostMapping
  public Book create(@Valid @RequestBody BookCreateReq req){
    return bookService.create(req.title(), req.author(), req.publisher(), req.totalPages(), req.tags());
  }

  @PatchMapping("/{id}/status")
  public Book patchStatus(@PathVariable Long id, @Valid @RequestBody BookStatusPatchReq req){
    return bookService.patchStatus(id, req);
  }
}
