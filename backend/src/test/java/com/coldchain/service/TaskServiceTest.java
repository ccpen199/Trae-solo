package com.coldchain.service;

import com.coldchain.entity.Task;
import com.coldchain.entity.User;
import com.coldchain.repository.TaskRepository;
import com.coldchain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TaskServiceTest {
    
    @Autowired
    private TaskService taskService;
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    private User testUser;
    
    @BeforeEach
    public void setup() {
        taskRepository.deleteAll();
        userRepository.deleteAll();
        
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setPassword("password");
        testUser.setRole("shipper");
        testUser = userRepository.save(testUser);
    }
    
    @Test
    public void testCreateTask() {
        Task task = new Task();
        task.setShipper(testUser);
        task.setGoodsInfo(Map.of("name", "测试货品", "quantity", 100));
        task.setTemperatureRange(Map.of("min", -18, "max", 5));
        task.setStartLocation(Map.of("address", "北京市", "lat", 39.9042, "lng", 116.4074));
        task.setEndLocation(Map.of("address", "上海市", "lat", 31.2304, "lng", 121.4737));
        task.setTimeLimit("24小时");
        
        Task createdTask = taskService.createTask(task);
        
        assertNotNull(createdTask);
        assertNotNull(createdTask.getTaskId());
        assertEquals("PENDING", createdTask.getTaskStatus());
        assertEquals(testUser.getUserId(), createdTask.getShipper().getUserId());
    }
    
    @Test
    public void testGetTaskById() {
        Task task = new Task();
        task.setShipper(testUser);
        task.setGoodsInfo(Map.of("name", "测试货品"));
        task.setTemperatureRange(Map.of("min", -18, "max", 5));
        task.setStartLocation(Map.of("address", "北京"));
        task.setEndLocation(Map.of("address", "上海"));
        Task createdTask = taskService.createTask(task);
        
        Optional<Task> foundTask = taskService.getTaskById(createdTask.getTaskId());
        
        assertTrue(foundTask.isPresent());
        assertEquals(createdTask.getTaskId(), foundTask.get().getTaskId());
    }
    
    @Test
    public void testStartTask() {
        Task task = new Task();
        task.setShipper(testUser);
        task.setGoodsInfo(Map.of("name", "测试货品"));
        task.setTemperatureRange(Map.of("min", -18, "max", 5));
        task.setStartLocation(Map.of("address", "北京"));
        task.setEndLocation(Map.of("address", "上海"));
        Task createdTask = taskService.createTask(task);
        
        Task startedTask = taskService.startTask(createdTask.getTaskId());
        
        assertEquals("IN_TRANSIT", startedTask.getTaskStatus());
    }
    
    @Test
    public void testCompleteTask() {
        Task task = new Task();
        task.setShipper(testUser);
        task.setGoodsInfo(Map.of("name", "测试货品"));
        task.setTemperatureRange(Map.of("min", -18, "max", 5));
        task.setStartLocation(Map.of("address", "北京"));
        task.setEndLocation(Map.of("address", "上海"));
        Task createdTask = taskService.createTask(task);
        
        Task completedTask = taskService.completeTask(createdTask.getTaskId());
        
        assertEquals("COMPLETED", completedTask.getTaskStatus());
    }
    
    @Test
    public void testCancelTask() {
        Task task = new Task();
        task.setShipper(testUser);
        task.setGoodsInfo(Map.of("name", "测试货品"));
        task.setTemperatureRange(Map.of("min", -18, "max", 5));
        task.setStartLocation(Map.of("address", "北京"));
        task.setEndLocation(Map.of("address", "上海"));
        Task createdTask = taskService.createTask(task);
        
        Task cancelledTask = taskService.cancelTask(createdTask.getTaskId());
        
        assertEquals("CANCELLED", cancelledTask.getTaskStatus());
    }
}
