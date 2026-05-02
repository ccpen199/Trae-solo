package com.coldchain.controller;

import com.coldchain.dto.ApiResponse;
import com.coldchain.entity.Role;
import com.coldchain.entity.Task;
import com.coldchain.entity.TaskStatus;
import com.coldchain.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tasks")
public class TaskController {
    @Autowired
    private TaskService taskService;
    
    @PostMapping
    @PreAuthorize("hasRole('SHIPPER') or hasRole('CARRIER')")
    public ResponseEntity<ApiResponse<Task>> createTask(
        HttpServletRequest request,
        @RequestBody Task task
    ) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        
        if (Role.SHIPPER.equals(role)) {
            task.setShipper(taskService.getUserById(userId));
        }
        
        task.setTaskStatus(TaskStatus.PENDING);
        Task createdTask = taskService.createTask(task);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(createdTask, "任务创建成功"));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Task>>> getTasks(
        HttpServletRequest request,
        @RequestParam(required = false) Long shipperId, 
        @RequestParam(required = false) Long driverId, 
        @RequestParam(required = false) String status
    ) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        
        List<Task> tasks;
        
        if (Role.QUALITY_CONTROL.equals(role)) {
            tasks = taskService.getAllTasks();
        } else if (Role.SHIPPER.equals(role)) {
            tasks = taskService.getTasksByShipperId(userId);
        } else if (Role.DRIVER.equals(role)) {
            tasks = taskService.getTasksByDriverId(userId);
        } else if (Role.CARRIER.equals(role)) {
            if (shipperId != null) {
                tasks = taskService.getTasksByShipperId(shipperId);
            } else if (driverId != null) {
                tasks = taskService.getTasksByDriverId(driverId);
            } else if (status != null) {
                tasks = taskService.getTasksByStatus(status);
            } else {
                tasks = taskService.getAllTasks();
            }
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("权限不足"));
        }
        
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }
    
    @GetMapping("/{taskId}")
    public ResponseEntity<ApiResponse<Task>> getTaskById(
        HttpServletRequest request,
        @PathVariable Long taskId
    ) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        
        return taskService.getTaskById(taskId)
            .map(task -> {
                if (canViewTask(task, userId, role)) {
                    return ResponseEntity.ok(ApiResponse.success(task));
                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .<ApiResponse<Task>>body(ApiResponse.error("权限不足，无法查看此任务"));
                }
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("任务不存在")));
    }
    
    @PutMapping("/{taskId}/assign")
    @PreAuthorize("hasRole('CARRIER')")
    public ResponseEntity<ApiResponse<Task>> assignTask(
        @PathVariable Long taskId, 
        @RequestBody Map<String, Long> assignData
    ) {
        Long carrierId = assignData.get("carrierId");
        Long driverId = assignData.get("driverId");
        
        try {
            Task assignedTask = taskService.assignTask(taskId, carrierId, driverId);
            return ResponseEntity.ok(ApiResponse.success(assignedTask, "任务分配成功"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{taskId}/start")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Task>> startTask(
        HttpServletRequest request,
        @PathVariable Long taskId
    ) {
        Long userId = (Long) request.getAttribute("userId");
        
        return taskService.getTaskById(taskId)
            .map(task -> {
                if (task.getDriver() != null && task.getDriver().getUserId().equals(userId)) {
                    try {
                        Task startedTask = taskService.startTask(taskId);
                        return ResponseEntity.ok(ApiResponse.success(startedTask, "任务已启动"));
                    } catch (RuntimeException e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .<ApiResponse<Task>>body(ApiResponse.error(e.getMessage()));
                    }
                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .<ApiResponse<Task>>body(ApiResponse.error("您不是此任务的司机"));
                }
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("任务不存在")));
    }
    
    @PutMapping("/{taskId}/complete")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<ApiResponse<Task>> completeTask(
        HttpServletRequest request,
        @PathVariable Long taskId
    ) {
        Long userId = (Long) request.getAttribute("userId");
        
        return taskService.getTaskById(taskId)
            .map(task -> {
                if (task.getDriver() != null && task.getDriver().getUserId().equals(userId)) {
                    try {
                        Task completedTask = taskService.completeTask(taskId);
                        return ResponseEntity.ok(ApiResponse.success(completedTask, "任务已完成"));
                    } catch (RuntimeException e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .<ApiResponse<Task>>body(ApiResponse.error(e.getMessage()));
                    }
                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .<ApiResponse<Task>>body(ApiResponse.error("您不是此任务的司机"));
                }
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("任务不存在")));
    }
    
    @PutMapping("/{taskId}/cancel")
    public ResponseEntity<ApiResponse<Task>> cancelTask(
        HttpServletRequest request,
        @PathVariable Long taskId
    ) {
        Long userId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("role");
        
        return taskService.getTaskById(taskId)
            .map(task -> {
                if (canCancelTask(task, userId, role)) {
                    try {
                        Task cancelledTask = taskService.cancelTask(taskId);
                        return ResponseEntity.ok(ApiResponse.success(cancelledTask, "任务已取消"));
                    } catch (RuntimeException e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .<ApiResponse<Task>>body(ApiResponse.error(e.getMessage()));
                    }
                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .<ApiResponse<Task>>body(ApiResponse.error("您没有权限取消此任务"));
                }
            })
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("任务不存在")));
    }
    
    private boolean canViewTask(Task task, Long userId, String role) {
        if (Role.QUALITY_CONTROL.equals(role) || Role.CARRIER.equals(role)) {
            return true;
        }
        if (Role.SHIPPER.equals(role) && task.getShipper() != null) {
            return task.getShipper().getUserId().equals(userId);
        }
        if (Role.DRIVER.equals(role) && task.getDriver() != null) {
            return task.getDriver().getUserId().equals(userId);
        }
        return false;
    }
    
    private boolean canCancelTask(Task task, Long userId, String role) {
        if (Role.CARRIER.equals(role)) {
            return true;
        }
        if (Role.SHIPPER.equals(role) && task.getShipper() != null) {
            return task.getShipper().getUserId().equals(userId);
        }
        return false;
    }
}
