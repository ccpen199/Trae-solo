package com.coldchain.entity;

import com.coldchain.config.JsonMapConverter;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "temperature_data")
public class TemperatureData {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long dataId;
    
    @ManyToOne
    @JoinColumn(name = "task_id")
    private Task task;
    
    @Column(nullable = false)
    private Double temperature;
    
    private Double humidity;
    
    @Convert(converter = JsonMapConverter.class)
    @Column(columnDefinition = "TEXT")
    private Map<String, Object> location;
    
    @Column(name = "collect_time", nullable = false)
    private LocalDateTime collectTime;
    
    // Getters and Setters
    public Long getDataId() {
        return dataId;
    }
    
    public void setDataId(Long dataId) {
        this.dataId = dataId;
    }
    
    public Task getTask() {
        return task;
    }
    
    public void setTask(Task task) {
        this.task = task;
    }
    
    public Double getTemperature() {
        return temperature;
    }
    
    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }
    
    public Double getHumidity() {
        return humidity;
    }
    
    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }
    
    public Map<String, Object> getLocation() {
        return location;
    }
    
    public void setLocation(Map<String, Object> location) {
        this.location = location;
    }
    
    public LocalDateTime getCollectTime() {
        return collectTime;
    }
    
    public void setCollectTime(LocalDateTime collectTime) {
        this.collectTime = collectTime;
    }
}
