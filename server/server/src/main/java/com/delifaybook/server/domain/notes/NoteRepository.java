package com.delifaybook.server.domain.notes;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findAllByUserIdAndIsbnOrderByCreatedAtDesc(Long userId, String isbn);

    Optional<Note> findByUserIdAndIsbnAndId(Long userId, String isbn, Long id);

    void deleteAllByUserIdAndIsbn(Long userId, String isbn);
}
