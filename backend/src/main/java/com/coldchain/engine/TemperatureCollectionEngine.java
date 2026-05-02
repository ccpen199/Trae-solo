package com.coldchain.engine;

import com.coldchain.entity.Task;
import com.coldchain.entity.TemperatureData;
import com.coldchain.repository.TaskRepository;
import com.coldchain.repository.TemperatureDataRepository;
import com.coldchain.service.AlarmService;
import com.coldchain.util.MapBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class TemperatureCollectionEngine {
    private static final Logger logger = LoggerFactory.getLogger(TemperatureCollectionEngine.class);
    
    @Autowired
    private TemperatureDataRepository temperatureDataRepository;
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private AlarmService alarmService;
    
    private final Map<Long, Task> activeTasks = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    
    public void startCollection(Long taskId) {
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task != null) {
            activeTasks.put(taskId, task);
            logger.info("Started temperature collection for task: {}", taskId);
        }
    }
    
    public void stopCollection(Long taskId) {
        activeTasks.remove(taskId);
        logger.info("Stopped temperature collection for task: {}", taskId);
    }
    
    public TemperatureData collectTemperatureData(Long taskId, Double temperature, Double humidity, Map<String, Object> location) {
        Task task = taskRepository.findById(taskId).orElseThrow(new java.util.function.Supplier<RuntimeException>() {
            @Override
            public RuntimeException get() {
                return new RuntimeException("Task not found");
            }
        });
        
        TemperatureData data = new TemperatureData();
        data.setTask(task);
        data.setTemperature(temperature);
        data.setHumidity(humidity);
        data.setLocation(location);
        data.setCollectTime(LocalDateTime.now());
        
        TemperatureData savedData = temperatureDataRepository.save(data);
        
        logger.debug("Collected temperature data for task {}: {}°C", taskId, temperature);
        
        checkTemperatureThreshold(task, temperature);
        
        return savedData;
    }
    
    private void checkTemperatureThreshold(Task task, Double temperature) {
        if (task.getTemperatureRange() == null) {
            return;
        }
        
        Object minObj = task.getTemperatureRange().get("min");
        Object maxObj = task.getTemperatureRange().get("max");
        
        if (minObj == null || maxObj == null) {
            return;
        }
        
        Double minTemp = minObj instanceof Number ? ((Number) minObj).doubleValue() : Double.parseDouble(minObj.toString());
        Double maxTemp = maxObj instanceof Number ? ((Number) maxObj).doubleValue() : Double.parseDouble(maxObj.toString());
        
        if (temperature < minTemp) {
            logger.warn("Temperature below minimum threshold for task {}: {}°C < {}°C", task.getTaskId(), temperature, minTemp);
            alarmService.triggerAlarm(task.getTaskId(), "TEMPERATURE_LOW", temperature, minTemp);
        } else if (temperature > maxTemp) {
            logger.warn("Temperature above maximum threshold for task {}: {}°C > {}°C", task.getTaskId(), temperature, maxTemp);
            alarmService.triggerAlarm(task.getTaskId(), "TEMPERATURE_HIGH", temperature, maxTemp);
        }
    }
    
    public List<TemperatureData> getTemperatureHistory(Long taskId, LocalDateTime start, LocalDateTime end) {
        return temperatureDataRepository.findByTask_TaskIdAndCollectTimeBetween(taskId, start, end);
    }
    
    public Map<String, Object> getTemperatureStatistics(Long taskId) {
        List<TemperatureData> dataList = temperatureDataRepository.findByTask_TaskId(taskId);
        
        if (dataList.isEmpty()) {
            return MapBuilder.of(
                "count", 0,
                "current", 0.0,
                "min", 0.0,
                "max", 0.0,
                "avg", 0.0
            );
        }
        
        double current = dataList.get(0).getTemperature();
        double min = dataList.stream().mapToDouble(new java.util.function.ToDoubleFunction<TemperatureData>() {
            @Override
            public double applyAsDouble(TemperatureData d) {
                return d.getTemperature();
            }
        }).min().orElse(0);
        double max = dataList.stream().mapToDouble(new java.util.function.ToDoubleFunction<TemperatureData>() {
            @Override
            public double applyAsDouble(TemperatureData d) {
                return d.getTemperature();
            }
        }).max().orElse(0);
        double avg = dataList.stream().mapToDouble(new java.util.function.ToDoubleFunction<TemperatureData>() {
            @Override
            public double applyAsDouble(TemperatureData d) {
                return d.getTemperature();
            }
        }).average().orElse(0);
        
        return MapBuilder.of(
            "count", dataList.size(),
            "current", current,
            "min", min,
            "max", max,
            "avg", Math.round(avg * 100) / 100.0
        );
    }
    
    public void simulateCollection(final Long taskId) {
        scheduler.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                double temperature = -18 + Math.random() * 25;
                double humidity = 40 + Math.random() * 40;
                
                try {
                    collectTemperatureData(taskId, temperature, humidity, null);
                } catch (Exception e) {
                    logger.error("Error in simulated collection: {}", e.getMessage());
                }
            }
        }, 0, 60, TimeUnit.SECONDS);
    }
}
