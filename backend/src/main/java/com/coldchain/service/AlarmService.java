package com.coldchain.service;

import com.coldchain.entity.Alarm;
import com.coldchain.entity.Task;
import com.coldchain.entity.User;
import com.coldchain.repository.AlarmRepository;
import com.coldchain.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AlarmService {
    @Autowired
    private AlarmRepository alarmRepository;
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private UserService userService;
    
    public Alarm triggerAlarm(Long taskId, String alarmType, Double alarmValue, Double thresholdValue) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        String alarmLevel = determineAlarmLevel(alarmValue, thresholdValue);
        
        Alarm alarm = new Alarm();
        alarm.setTask(task);
        alarm.setAlarmType(alarmType);
        alarm.setAlarmLevel(alarmLevel);
        alarm.setAlarmValue(alarmValue);
        alarm.setThresholdValue(thresholdValue);
        alarm.setAlarmTime(LocalDateTime.now());
        alarm.setHandleStatus("UNHANDLED");
        
        return alarmRepository.save(alarm);
    }
    
    private String determineAlarmLevel(Double alarmValue, Double thresholdValue) {
        double difference = Math.abs(alarmValue - thresholdValue);
        if (difference <= 2) {
            return "LEVEL1";
        } else if (difference <= 5) {
            return "LEVEL2";
        } else {
            return "LEVEL3";
        }
    }
    
    public List<Alarm> getAlarmsByTaskId(Long taskId) {
        return alarmRepository.findByTask_TaskId(taskId);
    }
    
    public List<Alarm> getUnhandledAlarmsByTaskId(Long taskId) {
        return alarmRepository.findByTask_TaskIdAndHandleStatus(taskId.toString(), "UNHANDLED");
    }
    
    public Alarm handleAlarm(Long alarmId, Long handlerId, String handleMethod) {
        Optional<Alarm> alarm = alarmRepository.findById(alarmId);
        if (alarm.isPresent()) {
            User handler = userService.getUserById(handlerId)
                    .orElseThrow(() -> new RuntimeException("Handler not found"));
            
            alarm.get().setHandleStatus("HANDLED");
            alarm.get().setHandleTime(LocalDateTime.now());
            alarm.get().setHandleMethod(handleMethod);
            alarm.get().setHandler(handler);
            
            return alarmRepository.save(alarm.get());
        }
        throw new RuntimeException("Alarm not found");
    }
}
