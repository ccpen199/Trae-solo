package com.coldchain.controller;

import com.coldchain.entity.Alarm;
import com.coldchain.service.AlarmService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/alarms")
public class AlarmController {
    @Autowired
    private AlarmService alarmService;
    
    @GetMapping("/{taskId}")
    public ResponseEntity<List<Alarm>> getAlarmsByTaskId(@PathVariable Long taskId) {
        List<Alarm> alarms = alarmService.getAlarmsByTaskId(taskId);
        return ResponseEntity.ok(alarms);
    }
    
    @PutMapping("/{alarmId}/handle")
    public ResponseEntity<Alarm> handleAlarm(@PathVariable Long alarmId, @RequestBody Map<String, Object> handleData) {
        Long handlerId = Long.parseLong(handleData.get("handlerId").toString());
        String handleMethod = handleData.get("handleMethod").toString();
        
        Alarm handledAlarm = alarmService.handleAlarm(alarmId, handlerId, handleMethod);
        return ResponseEntity.ok(handledAlarm);
    }
}
