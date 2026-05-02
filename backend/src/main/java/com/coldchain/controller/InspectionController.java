package com.coldchain.controller;

import com.coldchain.entity.Inspection;
import com.coldchain.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/inspections")
public class InspectionController {
    @Autowired
    private InspectionService inspectionService;
    
    @PostMapping
    public ResponseEntity<Inspection> createInspection(@RequestBody Map<String, Object> inspectionData) {
        Long taskId = Long.parseLong(inspectionData.get("taskId").toString());
        String inspectionResult = inspectionData.get("inspectionResult").toString();
        String problemDescription = inspectionData.containsKey("problemDescription") ? inspectionData.get("problemDescription").toString() : null;
        String shipperSignature = inspectionData.get("shipperSignature").toString();
        String driverSignature = inspectionData.get("driverSignature").toString();
        
        Inspection createdInspection = inspectionService.createInspection(taskId, inspectionResult, problemDescription, shipperSignature, driverSignature);
        return new ResponseEntity<>(createdInspection, HttpStatus.CREATED);
    }
    
    @GetMapping("/{taskId}")
    public ResponseEntity<Inspection> getInspectionByTaskId(@PathVariable Long taskId) {
        return inspectionService.getInspectionByTaskId(taskId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
