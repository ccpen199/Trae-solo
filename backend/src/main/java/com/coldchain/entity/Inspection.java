package com.coldchain.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inspections")
public class Inspection {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long inspectionId;
    
    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;
    
    @Column(name = "inspection_time", nullable = false)
    private LocalDateTime inspectionTime;
    
    @Column(name = "inspection_result", nullable = false)
    private String inspectionResult;
    
    @Column(name = "problem_description", columnDefinition = "text")
    private String problemDescription;
    
    @Column(name = "shipper_signature")
    private String shipperSignature;
    
    @Column(name = "driver_signature")
    private String driverSignature;
    
    // Getters and Setters
    public Long getInspectionId() {
        return inspectionId;
    }
    
    public void setInspectionId(Long inspectionId) {
        this.inspectionId = inspectionId;
    }
    
    public Task getTask() {
        return task;
    }
    
    public void setTask(Task task) {
        this.task = task;
    }
    
    public LocalDateTime getInspectionTime() {
        return inspectionTime;
    }
    
    public void setInspectionTime(LocalDateTime inspectionTime) {
        this.inspectionTime = inspectionTime;
    }
    
    public String getInspectionResult() {
        return inspectionResult;
    }
    
    public void setInspectionResult(String inspectionResult) {
        this.inspectionResult = inspectionResult;
    }
    
    public String getProblemDescription() {
        return problemDescription;
    }
    
    public void setProblemDescription(String problemDescription) {
        this.problemDescription = problemDescription;
    }
    
    public String getShipperSignature() {
        return shipperSignature;
    }
    
    public void setShipperSignature(String shipperSignature) {
        this.shipperSignature = shipperSignature;
    }
    
    public String getDriverSignature() {
        return driverSignature;
    }
    
    public void setDriverSignature(String driverSignature) {
        this.driverSignature = driverSignature;
    }
}
