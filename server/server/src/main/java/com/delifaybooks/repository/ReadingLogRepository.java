// src/main/java/com/delifaybooks/repository/ReadingLogRepository.java
package com.delifaybooks.repository;

import com.delifaybooks.domain.ReadingLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadingLogRepository extends JpaRepository<ReadingLog, Long> {}
