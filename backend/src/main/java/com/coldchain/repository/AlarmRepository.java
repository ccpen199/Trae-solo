package com.coldchain.repository;

import com.coldchain.entity.Alarm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlarmRepository extends JpaRepository<Alarm, Long> {
    List<Alarm> findByTask_TaskId(Long taskId);
    List<Alarm> findByTask_TaskIdAndHandleStatus(String taskId, String handleStatus);
}
