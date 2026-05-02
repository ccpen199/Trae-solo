package com.coldchain.engine;

import com.coldchain.entity.Alarm;
import com.coldchain.entity.Task;
import com.coldchain.entity.User;
import com.coldchain.repository.AlarmRepository;
import com.coldchain.repository.TaskRepository;
import com.coldchain.repository.UserRepository;
import com.coldchain.util.MapBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class AlarmEngine {
    private static final Logger logger = LoggerFactory.getLogger(AlarmEngine.class);
    
    @Autowired
    private AlarmRepository alarmRepository;
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    private final Map<String, AlarmThreshold> alarmThresholds = new ConcurrentHashMap<>();
    
    public static class AlarmThreshold {
        private double level1Threshold;
        private double level2Threshold;
        private double level3Threshold;
        
        public AlarmThreshold(double level1, double level2, double level3) {
            this.level1Threshold = level1;
            this.level2Threshold = level2;
            this.level3Threshold = level3;
        }
        
        public double getLevel1Threshold() { return level1Threshold; }
        public double getLevel2Threshold() { return level2Threshold; }
        public double getLevel3Threshold() { return level3Threshold; }
    }
    
    public Alarm triggerAlarm(Long taskId, String alarmType, Double alarmValue, Double thresholdValue) {
        Task task = taskRepository.findById(taskId).orElseThrow(new java.util.function.Supplier<RuntimeException>() {
            @Override
            public RuntimeException get() {
                return new RuntimeException("Task not found");
            }
        });
        
        String alarmLevel = determineAlarmLevel(alarmValue, thresholdValue);
        
        Alarm alarm = new Alarm();
        alarm.setTask(task);
        alarm.setAlarmType(alarmType);
        alarm.setAlarmLevel(alarmLevel);
        alarm.setAlarmValue(alarmValue);
        alarm.setThresholdValue(thresholdValue);
        alarm.setAlarmTime(LocalDateTime.now());
        alarm.setHandleStatus("UNHANDLED");
        
        Alarm savedAlarm = alarmRepository.save(alarm);
        
        logger.warn("Alarm triggered for task {}: {} - {} (Value: {}, Threshold: {})", 
                    taskId, alarmType, alarmLevel, alarmValue, thresholdValue);
        
        notifyAlarm(savedAlarm, task);
        
        return savedAlarm;
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
    
    private void notifyAlarm(Alarm alarm, Task task) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("alarmId", alarm.getAlarmId());
        notification.put("taskId", task.getTaskId());
        notification.put("alarmType", alarm.getAlarmType());
        notification.put("alarmLevel", alarm.getAlarmLevel());
        notification.put("alarmValue", alarm.getAlarmValue());
        notification.put("thresholdValue", alarm.getThresholdValue());
        notification.put("alarmTime", alarm.getAlarmTime().toString());
        notification.put("goodsName", task.getGoodsInfo() != null ? task.getGoodsInfo().getOrDefault("name", "") : "");
        
        messagingTemplate.convertAndSend("/topic/alarms", notification);
        
        List<User> relevantUsers = getRelevantUsers(task);
        for (User user : relevantUsers) {
            Map<String, Object> userNotification = new ConcurrentHashMap<>(notification);
            userNotification.put("userId", user.getUserId());
            messagingTemplate.convertAndSendToUser(
                user.getUserId().toString(), 
                "/queue/alarms", 
                userNotification
            );
        }
        
        logger.info("Notified {} users about alarm {}", relevantUsers.size(), alarm.getAlarmId());
    }
    
    private List<User> getRelevantUsers(Task task) {
        return userRepository.findAll().stream()
            .filter(new java.util.function.Predicate<User>() {
                @Override
                public boolean test(User user) {
                    String role = user.getRole();
                    if ("shipper".equals(role) && task.getShipper() != null && 
                        task.getShipper().getUserId().equals(user.getUserId())) {
                        return true;
                    }
                    if ("driver".equals(role) && task.getDriver() != null && 
                        task.getDriver().getUserId().equals(user.getUserId())) {
                        return true;
                    }
                    if ("quality_control".equals(role)) {
                        return true;
                    }
                    return false;
                }
            })
            .collect(Collectors.toList());
    }
    
    public Alarm handleAlarm(Long alarmId, Long handlerId, String handleMethod) {
        Alarm alarm = alarmRepository.findById(alarmId)
            .orElseThrow(new java.util.function.Supplier<RuntimeException>() {
                @Override
                public RuntimeException get() {
                    return new RuntimeException("Alarm not found");
                }
            });
        
        User handler = userRepository.findById(handlerId)
            .orElseThrow(new java.util.function.Supplier<RuntimeException>() {
                @Override
                public RuntimeException get() {
                    return new RuntimeException("Handler not found");
                }
            });
        
        alarm.setHandleStatus("HANDLED");
        alarm.setHandleTime(LocalDateTime.now());
        alarm.setHandleMethod(handleMethod);
        alarm.setHandler(handler);
        
        Alarm savedAlarm = alarmRepository.save(alarm);
        
        logger.info("Alarm {} handled by user {}: {}", alarmId, handlerId, handleMethod);
        
        notifyAlarmHandled(savedAlarm);
        
        return savedAlarm;
    }
    
    private void notifyAlarmHandled(Alarm alarm) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("alarmId", alarm.getAlarmId());
        notification.put("taskId", alarm.getTask().getTaskId());
        notification.put("handleStatus", "HANDLED");
        notification.put("handleTime", alarm.getHandleTime().toString());
        notification.put("handleMethod", alarm.getHandleMethod() != null ? alarm.getHandleMethod() : "");
        
        messagingTemplate.convertAndSend("/topic/alarms/" + alarm.getTask().getTaskId(), notification);
    }
    
    public List<Alarm> getUnhandledAlarms() {
        return alarmRepository.findAll().stream()
            .filter(new java.util.function.Predicate<Alarm>() {
                @Override
                public boolean test(Alarm alarm) {
                    return "UNHANDLED".equals(alarm.getHandleStatus());
                }
            })
            .collect(Collectors.toList());
    }
    
    public List<Alarm> getUnhandledAlarmsByTaskId(Long taskId) {
        return alarmRepository.findByTask_TaskId(taskId).stream()
            .filter(new java.util.function.Predicate<Alarm>() {
                @Override
                public boolean test(Alarm alarm) {
                    return "UNHANDLED".equals(alarm.getHandleStatus());
                }
            })
            .collect(Collectors.toList());
    }
    
    public Map<String, Object> getAlarmStatistics() {
        List<Alarm> allAlarms = alarmRepository.findAll();
        
        long totalAlarms = allAlarms.size();
        long unhandledAlarms = allAlarms.stream()
            .filter(new java.util.function.Predicate<Alarm>() {
                @Override
                public boolean test(Alarm alarm) {
                    return "UNHANDLED".equals(alarm.getHandleStatus());
                }
            })
            .count();
        long handledAlarms = totalAlarms - unhandledAlarms;
        
        long level1Alarms = allAlarms.stream()
            .filter(new java.util.function.Predicate<Alarm>() {
                @Override
                public boolean test(Alarm alarm) {
                    return "LEVEL1".equals(alarm.getAlarmLevel());
                }
            })
            .count();
        long level2Alarms = allAlarms.stream()
            .filter(new java.util.function.Predicate<Alarm>() {
                @Override
                public boolean test(Alarm alarm) {
                    return "LEVEL2".equals(alarm.getAlarmLevel());
                }
            })
            .count();
        long level3Alarms = allAlarms.stream()
            .filter(new java.util.function.Predicate<Alarm>() {
                @Override
                public boolean test(Alarm alarm) {
                    return "LEVEL3".equals(alarm.getAlarmLevel());
                }
            })
            .count();
        
        long temperatureAlarms = allAlarms.stream()
            .filter(new java.util.function.Predicate<Alarm>() {
                @Override
                public boolean test(Alarm alarm) {
                    return alarm.getAlarmType().startsWith("TEMPERATURE");
                }
            })
            .count();
        long humidityAlarms = allAlarms.stream()
            .filter(new java.util.function.Predicate<Alarm>() {
                @Override
                public boolean test(Alarm alarm) {
                    return alarm.getAlarmType().startsWith("HUMIDITY");
                }
            })
            .count();
        
        double handleRate = totalAlarms > 0 ? (handledAlarms * 100.0 / totalAlarms) : 0;
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalAlarms", totalAlarms);
        result.put("unhandledAlarms", unhandledAlarms);
        result.put("handledAlarms", handledAlarms);
        result.put("handleRate", Math.round(handleRate * 100) / 100.0);
        result.put("level1Alarms", level1Alarms);
        result.put("level2Alarms", level2Alarms);
        result.put("level3Alarms", level3Alarms);
        result.put("temperatureAlarms", temperatureAlarms);
        result.put("humidityAlarms", humidityAlarms);
        return result;
    }
    
    public void setAlarmThreshold(String taskType, double level1, double level2, double level3) {
        alarmThresholds.put(taskType, new AlarmThreshold(level1, level2, level3));
    }
}
