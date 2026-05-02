package com.coldchain.service;

import com.coldchain.entity.Task;
import com.coldchain.entity.TemperatureData;
import com.coldchain.entity.Alarm;
import com.coldchain.entity.Inspection;
import com.coldchain.repository.TaskRepository;
import com.coldchain.repository.TemperatureDataRepository;
import com.coldchain.repository.AlarmRepository;
import com.coldchain.repository.InspectionRepository;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReportService {
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private TemperatureDataRepository temperatureDataRepository;
    
    @Autowired
    private AlarmRepository alarmRepository;
    
    @Autowired
    private InspectionRepository inspectionRepository;
    
    public String generateTemperatureReport(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        List<TemperatureData> temperatureDataList = temperatureDataRepository.findByTask_TaskId(taskId);
        List<Alarm> alarmList = alarmRepository.findByTask_TaskId(taskId);
        Optional<Inspection> inspection = inspectionRepository.findByTask_TaskId(taskId);
        
        String reportPath = "/tmp/coldchain_report_" + taskId + ".pdf";
        
        try {
            Document document = new Document();
            PdfWriter.getInstance(document, new FileOutputStream(reportPath));
            document.open();
            
            // 添加报告标题
            document.add(new Paragraph("冷链物流温控报告"));
            document.add(new Paragraph("任务ID: " + task.getTaskId()));
            document.add(new Paragraph("货主: " + task.getShipper().getUsername()));
            document.add(new Paragraph("司机: " + (task.getDriver() != null ? task.getDriver().getUsername() : "未分配")));
            document.add(new Paragraph("任务状态: " + task.getTaskStatus()));
            document.add(new Paragraph("温度区间: " + task.getTemperatureRange()));
            document.add(new Paragraph("起始位置: " + task.getStartLocation()));
            document.add(new Paragraph("目的地: " + task.getEndLocation()));
            document.add(new Paragraph("创建时间: " + task.getCreatedAt()));
            document.add(new Paragraph(""));
            
            // 添加温度数据
            document.add(new Paragraph("温度数据记录:"));
            for (TemperatureData data : temperatureDataList) {
                document.add(new Paragraph("时间: " + data.getCollectTime() + ", 温度: " + data.getTemperature() + "°C, 湿度: " + (data.getHumidity() != null ? data.getHumidity() : "N/A")));
            }
            document.add(new Paragraph(""));
            
            // 添加告警记录
            document.add(new Paragraph("告警记录:"));
            for (Alarm alarm : alarmList) {
                document.add(new Paragraph("时间: " + alarm.getAlarmTime() + ", 类型: " + alarm.getAlarmType() + ", 级别: " + alarm.getAlarmLevel() + ", 值: " + alarm.getAlarmValue() + ", 状态: " + alarm.getHandleStatus()));
            }
            document.add(new Paragraph(""));
            
            // 添加验收信息
            if (inspection.isPresent()) {
                document.add(new Paragraph("验收信息:"));
                document.add(new Paragraph("验收时间: " + inspection.get().getInspectionTime()));
                document.add(new Paragraph("验收结果: " + inspection.get().getInspectionResult()));
                if (inspection.get().getProblemDescription() != null) {
                    document.add(new Paragraph("问题描述: " + inspection.get().getProblemDescription()));
                }
                document.add(new Paragraph("货主签名: " + inspection.get().getShipperSignature()));
                document.add(new Paragraph("司机签名: " + inspection.get().getDriverSignature()));
            }
            
            document.close();
        } catch (DocumentException | IOException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate report");
        }
        
        return reportPath;
    }
    
    public String generateQualityReport() {
        // 实现质控分析报表生成逻辑
        // 这里可以添加统计数据、图表等
        String reportPath = "/tmp/quality_report_" + LocalDateTime.now().toString().replace(":", "-") + ".pdf";
        
        try {
            Document document = new Document();
            PdfWriter.getInstance(document, new FileOutputStream(reportPath));
            document.open();
            
            document.add(new Paragraph("质控分析报表"));
            document.add(new Paragraph("生成时间: " + LocalDateTime.now()));
            document.add(new Paragraph(""));
            document.add(new Paragraph("历史任务统计:"));
            document.add(new Paragraph("告警率分析:"));
            document.add(new Paragraph("处理率分析:"));
            document.add(new Paragraph("异常类型分布:"));
            document.add(new Paragraph("温度合规率:"));
            
            document.close();
        } catch (DocumentException | IOException e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to generate quality report");
        }
        
        return reportPath;
    }
}
