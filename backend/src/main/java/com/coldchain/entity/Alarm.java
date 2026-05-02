package com.coldchain.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alarms")
public class Alarm {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long alarmId;
    
    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;
    
    @Column(name = "alarm_type", nullable = false)
    private String alarmType;
    
    @Column(name = "alarm_level", nullable = false)
    private String alarmLevel;
    
    @Column(name = "alarm_value", nullable = false)
    private Double alarmValue;
    
    @Column(name = "threshold_value", nullable = false)
    private Double thresholdValue;
    
    @Column(name = "alarm_time", nullable = false)
    private LocalDateTime alarmTime;
    
    @Column(name = "handle_status", nullable = false)
    private String handleStatus;
    
    @Column(name = "handle_time")
    private LocalDateTime handleTime;
    
    @Column(name = "handle_method", columnDefinition = "text")
    private String handleMethod;
    
    @ManyToOne
    @JoinColumn(name = "handler_id")
    private User handler;
    
    // Getters and Setters
    public Long getAlarmId() {
        return alarmId;
    }
    
    public void setAlarmId(Long alarmId) {
        this.alarmId = alarmId;
    }
    
    public Task getTask() {
        return task;
    }
    
    public void setTask(Task task) {
        this.task = task;
    }
    
    public String getAlarmType() {
        return alarmType;
    }
    
    public void setAlarmType(String alarmType) {
        this.alarmType = alarmType;
    }
    
    public String getAlarmLevel() {
        return alarmLevel;
    }
    
    public void setAlarmLevel(String alarmLevel) {
        this.alarmLevel = alarmLevel;
    }
    
    public Double getAlarmValue() {
        return alarmValue;
    }
    
    public void setAlarmValue(Double alarmValue) {
        this.alarmValue = alarmValue;
    }
    
    public Double getThresholdValue() {
        return thresholdValue;
    }
    
    public void setThresholdValue(Double thresholdValue) {
        this.thresholdValue = thresholdValue;
    }
    
    public LocalDateTime getAlarmTime() {
        return alarmTime;
    }
    
    public void setAlarmTime(LocalDateTime alarmTime) {
        this.alarmTime = alarmTime;
    }
    
    public String getHandleStatus() {
        return handleStatus;
    }
    
    public void setHandleStatus(String handleStatus) {
        this.handleStatus = handleStatus;
    }
    
    public LocalDateTime getHandleTime() {
        return handleTime;
    }
    
    public void setHandleTime(LocalDateTime handleTime) {
        this.handleTime = handleTime;
    }
    
    public String getHandleMethod() {
        return handleMethod;
    }
    
    public void setHandleMethod(String handleMethod) {
        this.handleMethod = handleMethod;
    }
    
    public User getHandler() {
        return handler;
    }
    
    public void setHandler(User handler) {
        this.handler = handler;
    }
}
