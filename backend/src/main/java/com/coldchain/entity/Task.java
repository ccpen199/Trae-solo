package com.coldchain.entity;

import com.coldchain.config.JsonMapConverter;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long taskId;
    
    @ManyToOne
    @JoinColumn(name = "shipper_id")
    private User shipper;
    
    @ManyToOne
    @JoinColumn(name = "carrier_id")
    private User carrier;
    
    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;
    
    @Column(name = "task_status", nullable = false)
    private String taskStatus;
    
    @Convert(converter = JsonMapConverter.class)
    @Column(name = "goods_info", columnDefinition = "TEXT", nullable = false)
    private Map<String, Object> goodsInfo;
    
    @Convert(converter = JsonMapConverter.class)
    @Column(name = "temperature_range", columnDefinition = "TEXT", nullable = false)
    private Map<String, Object> temperatureRange;
    
    @Column(name = "time_limit")
    private String timeLimit;
    
    @Convert(converter = JsonMapConverter.class)
    @Column(name = "start_location", columnDefinition = "TEXT", nullable = false)
    private Map<String, Object> startLocation;
    
    @Convert(converter = JsonMapConverter.class)
    @Column(name = "end_location", columnDefinition = "TEXT", nullable = false)
    private Map<String, Object> endLocation;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // 自动设置时间戳
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getTaskId() {
        return taskId;
    }
    
    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }
    
    public User getShipper() {
        return shipper;
    }
    
    public void setShipper(User shipper) {
        this.shipper = shipper;
    }
    
    public User getCarrier() {
        return carrier;
    }
    
    public void setCarrier(User carrier) {
        this.carrier = carrier;
    }
    
    public User getDriver() {
        return driver;
    }
    
    public void setDriver(User driver) {
        this.driver = driver;
    }
    
    public String getTaskStatus() {
        return taskStatus;
    }
    
    public void setTaskStatus(String taskStatus) {
        this.taskStatus = taskStatus;
    }
    
    public Map<String, Object> getGoodsInfo() {
        return goodsInfo;
    }
    
    public void setGoodsInfo(Map<String, Object> goodsInfo) {
        this.goodsInfo = goodsInfo;
    }
    
    public Map<String, Object> getTemperatureRange() {
        return temperatureRange;
    }
    
    public void setTemperatureRange(Map<String, Object> temperatureRange) {
        this.temperatureRange = temperatureRange;
    }
    
    public String getTimeLimit() {
        return timeLimit;
    }
    
    public void setTimeLimit(String timeLimit) {
        this.timeLimit = timeLimit;
    }
    
    public Map<String, Object> getStartLocation() {
        return startLocation;
    }
    
    public void setStartLocation(Map<String, Object> startLocation) {
        this.startLocation = startLocation;
    }
    
    public Map<String, Object> getEndLocation() {
        return endLocation;
    }
    
    public void setEndLocation(Map<String, Object> endLocation) {
        this.endLocation = endLocation;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
