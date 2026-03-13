package com.delifaybook.server.domain.bookshelf;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookshelfRepository extends JpaRepository<Bookshelf, Long> {

    Optional<Bookshelf> findByUserIdAndIsbn(Long userId, String isbn);

    boolean existsByUserIdAndIsbn(Long userId, String isbn);

    List<Bookshelf> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    void deleteByUserIdAndIsbn(Long userId, String isbn);
}
