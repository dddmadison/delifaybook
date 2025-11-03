// src/main/java/com/delifaybooks/repository/BookRepository.java
package com.delifaybooks.repository;

import com.delifaybooks.domain.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {
  List<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String title, String author);

  // list 기본 정렬용(서비스에서 Sort 적용 가능하지만 남겨둠)
  default List<Book> findAllDesc() {
    return findAll(Sort.by(Sort.Direction.DESC, "id"));
  }
}
