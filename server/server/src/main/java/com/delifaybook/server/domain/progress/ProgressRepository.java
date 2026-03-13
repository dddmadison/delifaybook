package com.delifaybook.server.domain.progress;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProgressRepository extends JpaRepository<Progress, Long> {

    Optional<Progress> findByUserIdAndIsbn(Long userId, String isbn);

    List<Progress> findAllByUserIdAndIsbnIn(Long userId, List<String> isbns);

    void deleteByUserIdAndIsbn(Long userId, String isbn);
}
