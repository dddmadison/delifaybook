// src/main/java/com/delifaybooks/service/BookService.java
package com.delifaybooks.service;

import com.delifaybooks.domain.Book;
import com.delifaybooks.dto.BookStatusPatchReq;
import com.delifaybooks.repository.BookRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class BookService {
  private final BookRepository repo;
  public BookService(BookRepository repo){ this.repo = repo; }

  public Book create(String title, String author, String publisher, Integer totalPages, List<String> tags){
    Book b = new Book();
    b.setTitle(title);
    b.setAuthor(author);
    b.setPublisher(publisher);
    b.setTotalPages(totalPages);
    b.setTags(tags);
    b.setStatus(Book.Status.UNREAD);
    return repo.save(b);
  }

  public Book get(Long id){
    return repo.findById(id).orElseThrow(() -> new NoSuchElementException("book"));
  }

  public List<Book> list(String q){
    if(q==null || q.isBlank()) return repo.findAll(Sort.by(Sort.Direction.DESC,"id"));
    return repo.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(q,q);
  }

  public Book patchStatus(Long id, BookStatusPatchReq req){
    Book b = get(id);
    b.setStatus(req.status());
    return repo.save(b);
  }
}
