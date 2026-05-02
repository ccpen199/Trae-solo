package com.coldchain.controller;

import com.coldchain.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;

@RestController
@RequestMapping("/reports")
public class ReportController {
    @Autowired
    private ReportService reportService;
    
    @GetMapping("/{taskId}")
    public ResponseEntity<FileSystemResource> generateReport(@PathVariable Long taskId) {
        String reportPath = reportService.generateTemperatureReport(taskId);
        File reportFile = new File(reportPath);
        
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report_" + taskId + ".pdf");
        
        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new FileSystemResource(reportFile));
    }
    
    @GetMapping("/{taskId}/download")
    public ResponseEntity<FileSystemResource> downloadReport(@PathVariable Long taskId) {
        String reportPath = reportService.generateTemperatureReport(taskId);
        File reportFile = new File(reportPath);
        
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report_" + taskId + ".pdf");
        
        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new FileSystemResource(reportFile));
    }
    
    @GetMapping("/quality")
    public ResponseEntity<FileSystemResource> generateQualityReport() {
        String reportPath = reportService.generateQualityReport();
        File reportFile = new File(reportPath);
        
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=quality_report.pdf");
        
        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_PDF)
                .body(new FileSystemResource(reportFile));
    }
}
