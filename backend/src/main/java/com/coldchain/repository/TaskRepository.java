package com.coldchain.repository;

import com.coldchain.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByShipper_UserId(Long shipperId);
    List<Task> findByDriver_UserId(Long driverId);
    List<Task> findByTaskStatus(String taskStatus);
}
