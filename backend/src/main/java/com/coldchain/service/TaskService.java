package com.coldchain.service;

import com.coldchain.entity.Task;
import com.coldchain.entity.TaskStatus;
import com.coldchain.entity.User;
import com.coldchain.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private UserService userService;
    
    public Task createTask(Task task) {
        task.setTaskStatus(TaskStatus.PENDING);
        return taskRepository.save(task);
    }
    
    public Optional<Task> getTaskById(Long taskId) {
        return taskRepository.findById(taskId);
    }
    
    public User getUserById(Long userId) {
        return userService.getUserById(userId).orElse(null);
    }
    
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }
    
    public List<Task> getTasksByShipperId(Long shipperId) {
        return taskRepository.findByShipper_UserId(shipperId);
    }
    
    public List<Task> getTasksByDriverId(Long driverId) {
        return taskRepository.findByDriver_UserId(driverId);
    }
    
    public List<Task> getTasksByStatus(String status) {
        return taskRepository.findByTaskStatus(status);
    }
    
    public Task assignTask(Long taskId, Long carrierId, Long driverId) {
        Optional<Task> task = taskRepository.findById(taskId);
        if (task.isPresent()) {
            Optional<User> carrier = userService.getUserById(carrierId);
            Optional<User> driver = userService.getUserById(driverId);
            
            if (carrier.isPresent() && driver.isPresent()) {
                task.get().setCarrier(carrier.get());
                task.get().setDriver(driver.get());
                task.get().setTaskStatus(TaskStatus.ASSIGNED);
                return taskRepository.save(task.get());
            }
            throw new RuntimeException("承运商或司机不存在");
        }
        throw new RuntimeException("任务不存在");
    }
    
    public Task startTask(Long taskId) {
        Optional<Task> task = taskRepository.findById(taskId);
        if (task.isPresent()) {
            if (!TaskStatus.ASSIGNED.equals(task.get().getTaskStatus())) {
                throw new RuntimeException("只有已分配的任务才能启动");
            }
            task.get().setTaskStatus(TaskStatus.IN_TRANSIT);
            return taskRepository.save(task.get());
        }
        throw new RuntimeException("任务不存在");
    }
    
    public Task completeTask(Long taskId) {
        Optional<Task> task = taskRepository.findById(taskId);
        if (task.isPresent()) {
            if (!TaskStatus.IN_TRANSIT.equals(task.get().getTaskStatus())) {
                throw new RuntimeException("只有运输中的任务才能完成");
            }
            task.get().setTaskStatus(TaskStatus.COMPLETED);
            return taskRepository.save(task.get());
        }
        throw new RuntimeException("任务不存在");
    }
    
    public Task cancelTask(Long taskId) {
        Optional<Task> task = taskRepository.findById(taskId);
        if (task.isPresent()) {
            if (TaskStatus.COMPLETED.equals(task.get().getTaskStatus())) {
                throw new RuntimeException("已完成的任务不能取消");
            }
            task.get().setTaskStatus(TaskStatus.CANCELLED);
            return taskRepository.save(task.get());
        }
        throw new RuntimeException("任务不存在");
    }
}
