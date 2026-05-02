package com.coldchain.service;

import com.coldchain.entity.Inspection;
import com.coldchain.entity.Task;
import com.coldchain.repository.InspectionRepository;
import com.coldchain.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class InspectionService {
    @Autowired
    private InspectionRepository inspectionRepository;
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private TaskService taskService;
    
    public Inspection createInspection(Long taskId, String inspectionResult, String problemDescription, String shipperSignature, String driverSignature) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        // 检查是否已有验收记录
        Optional<Inspection> existingInspection = inspectionRepository.findByTask_TaskId(taskId);
        if (existingInspection.isPresent()) {
            throw new RuntimeException("Inspection already exists for this task");
        }
        
        Inspection inspection = new Inspection();
        inspection.setTask(task);
        inspection.setInspectionTime(LocalDateTime.now());
        inspection.setInspectionResult(inspectionResult);
        inspection.setProblemDescription(problemDescription);
        inspection.setShipperSignature(shipperSignature);
        inspection.setDriverSignature(driverSignature);
        
        Inspection savedInspection = inspectionRepository.save(inspection);
        
        // 完成任务
        taskService.completeTask(taskId);
        
        return savedInspection;
    }
    
    public Optional<Inspection> getInspectionByTaskId(Long taskId) {
        return inspectionRepository.findByTask_TaskId(taskId);
    }
}
