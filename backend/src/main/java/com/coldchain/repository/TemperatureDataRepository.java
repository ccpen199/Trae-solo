package com.coldchain.repository;

import com.coldchain.entity.TemperatureData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TemperatureDataRepository extends JpaRepository<TemperatureData, Long> {
    List<TemperatureData> findByTask_TaskId(Long taskId);
    List<TemperatureData> findByTask_TaskIdAndCollectTimeBetween(Long taskId, LocalDateTime start, LocalDateTime end);
}
