package com.coldchain.controller;

import com.coldchain.entity.TemperatureData;
import com.coldchain.service.TemperatureDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/temperature")
public class TemperatureDataController {
    @Autowired
    private TemperatureDataService temperatureDataService;
    
    @PostMapping
    public ResponseEntity<TemperatureData> collectTemperature(@RequestBody Map<String, Object> data) {
        Long taskId = Long.parseLong(data.get("taskId").toString());
        Double temperature = Double.parseDouble(data.get("temperature").toString());
        Double humidity = data.containsKey("humidity") ? Double.parseDouble(data.get("humidity").toString()) : null;
        Map<String, Object> location = data.containsKey("location") ? (Map<String, Object>) data.get("location") : null;
        
        TemperatureData collectedData = temperatureDataService.collectTemperature(taskId, temperature, humidity, location);
        return new ResponseEntity<>(collectedData, HttpStatus.CREATED);
    }
    
    @GetMapping("/{taskId}")
    public ResponseEntity<List<TemperatureData>> getTemperatureDataByTaskId(@PathVariable Long taskId) {
        List<TemperatureData> dataList = temperatureDataService.getTemperatureDataByTaskId(taskId);
        return ResponseEntity.ok(dataList);
    }
    
    @GetMapping("/{taskId}/chart")
    public ResponseEntity<List<TemperatureData>> getTemperatureChartData(@PathVariable Long taskId, 
                                                                       @RequestParam String start, 
                                                                       @RequestParam String end) {
        LocalDateTime startTime = LocalDateTime.parse(start);
        LocalDateTime endTime = LocalDateTime.parse(end);
        
        List<TemperatureData> dataList = temperatureDataService.getTemperatureDataByTaskIdAndTimeRange(taskId, startTime, endTime);
        return ResponseEntity.ok(dataList);
    }
}
