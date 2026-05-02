package com.coldchain.engine;

import com.coldchain.entity.Alarm;
import com.coldchain.entity.Task;
import com.coldchain.repository.AlarmRepository;
import com.coldchain.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AlarmEngineTest {
    
    @Autowired
    private AlarmEngine alarmEngine;
    
    @Autowired
    private AlarmRepository alarmRepository;
    
    @Autowired
    private TaskRepository taskRepository;
    
    private Task testTask;
    
    @BeforeEach
    public void setup() {
        alarmRepository.deleteAll();
        taskRepository.deleteAll();
        
        testTask = new Task();
        testTask.setGoodsInfo(Map.of("name", "测试货品"));
        testTask.setTemperatureRange(Map.of("min", -18, "max", 5));
        testTask.setStartLocation(Map.of("address", "北京"));
        testTask.setEndLocation(Map.of("address", "上海"));
        testTask.setTaskStatus("IN_TRANSIT");
        testTask = taskRepository.save(testTask);
    }
    
    @Test
    public void testTriggerAlarm() {
        Alarm alarm = alarmEngine.triggerAlarm(testTask.getTaskId(), "TEMPERATURE_HIGH", 8.0, 5.0);
        
        assertNotNull(alarm);
        assertNotNull(alarm.getAlarmId());
        assertEquals("TEMPERATURE_HIGH", alarm.getAlarmType());
        assertEquals("UNHANDLED", alarm.getHandleStatus());
    }
    
    @Test
    public void testGetUnhandledAlarms() {
        alarmEngine.triggerAlarm(testTask.getTaskId(), "TEMPERATURE_HIGH", 8.0, 5.0);
        alarmEngine.triggerAlarm(testTask.getTaskId(), "TEMPERATURE_LOW", -20.0, -18.0);
        
        List<Alarm> unhandledAlarms = alarmEngine.getUnhandledAlarms();
        
        assertTrue(unhandledAlarms.size() >= 2);
    }
    
    @Test
    public void testGetAlarmStatistics() {
        alarmEngine.triggerAlarm(testTask.getTaskId(), "TEMPERATURE_HIGH", 8.0, 5.0);
        alarmEngine.triggerAlarm(testTask.getTaskId(), "TEMPERATURE_LOW", -20.0, -18.0);
        
        Map<String, Object> stats = alarmEngine.getAlarmStatistics();
        
        assertNotNull(stats);
        assertTrue((Long) stats.get("totalAlarms") >= 2);
    }
}
