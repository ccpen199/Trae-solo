package com.coldchain.engine;

import com.coldchain.entity.Task;
import com.coldchain.entity.TemperatureData;
import com.coldchain.repository.TaskRepository;
import com.coldchain.repository.TemperatureDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class TemperatureCollectionEngineTest {
    
    @Autowired
    private TemperatureCollectionEngine engine;
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private TemperatureDataRepository temperatureDataRepository;
    
    private Task testTask;
    
    @BeforeEach
    public void setup() {
        temperatureDataRepository.deleteAll();
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
    public void testCollectTemperatureData() {
        Double temperature = -15.5;
        Double humidity = 45.0;
        Map<String, Object> location = Map.of("lat", 39.9042, "lng", 116.4074, "address", "北京市朝阳区");
        
        TemperatureData collected = engine.collectTemperatureData(testTask.getTaskId(), temperature, humidity, location);
        
        assertNotNull(collected);
        assertNotNull(collected.getDataId());
        assertEquals(temperature, collected.getTemperature());
        assertEquals(humidity, collected.getHumidity());
        assertEquals(location, collected.getLocation());
    }
    
    @Test
    public void testGetTemperatureStatistics() {
        engine.collectTemperatureData(testTask.getTaskId(), -15.0, 40.0, null);
        engine.collectTemperatureData(testTask.getTaskId(), -18.0, 45.0, null);
        engine.collectTemperatureData(testTask.getTaskId(), -12.0, 50.0, null);
        
        Map<String, Object> stats = engine.getTemperatureStatistics(testTask.getTaskId());
        
        assertNotNull(stats);
        assertEquals(3, stats.get("count"));
        assertEquals(-12.0, stats.get("max"));
        assertEquals(-18.0, stats.get("min"));
    }
    
    @Test
    public void testStartAndStopCollection() {
        engine.startCollection(testTask.getTaskId());
        engine.stopCollection(testTask.getTaskId());
    }
}
