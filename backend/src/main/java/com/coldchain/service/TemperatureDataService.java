package com.coldchain.service;

import com.coldchain.entity.Task;
import com.coldchain.entity.TemperatureData;
import com.coldchain.repository.TaskRepository;
import com.coldchain.repository.TemperatureDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TemperatureDataService {
    @Autowired
    private TemperatureDataRepository temperatureDataRepository;
    
    @Autowired
    private TaskRepository taskRepository;
    
    public TemperatureData collectTemperature(Long taskId, Double temperature, Double humidity, java.util.Map<String, Object> location) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        TemperatureData data = new TemperatureData();
        data.setTask(task);
        data.setTemperature(temperature);
        data.setHumidity(humidity);
        data.setLocation(location);
        data.setCollectTime(LocalDateTime.now());
        
        return temperatureDataRepository.save(data);
    }
    
    public List<TemperatureData> getTemperatureDataByTaskId(Long taskId) {
        return temperatureDataRepository.findByTask_TaskId(taskId);
    }
    
    public List<TemperatureData> getTemperatureDataByTaskIdAndTimeRange(Long taskId, LocalDateTime start, LocalDateTime end) {
        return temperatureDataRepository.findByTask_TaskIdAndCollectTimeBetween(taskId, start, end);
    }
}
