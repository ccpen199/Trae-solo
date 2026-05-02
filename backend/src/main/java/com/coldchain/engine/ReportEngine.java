package com.coldchain.engine;

import com.coldchain.entity.*;
import com.coldchain.repository.*;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import com.itextpdf.text.pdf.draw.LineSeparator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class ReportEngine {
    private static final Logger logger = LoggerFactory.getLogger(ReportEngine.class);
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private TemperatureDataRepository temperatureDataRepository;
    
    @Autowired
    private AlarmRepository alarmRepository;
    
    @Autowired
    private InspectionRepository inspectionRepository;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter FILE_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    
    private static Map<String, String> statusNames;
    private static Map<String, String> categoryNames;
    private static Map<String, String> alarmTypeNames;
    private static Map<String, BaseColor> alarmLevelColors;
    
    static {
        statusNames = new HashMap<>();
        statusNames.put("PENDING", "待分配");
        statusNames.put("ASSIGNED", "已分配");
        statusNames.put("IN_TRANSIT", "运输中");
        statusNames.put("COMPLETED", "已完成");
        statusNames.put("CANCELLED", "已取消");
        
        categoryNames = new HashMap<>();
        categoryNames.put("fresh", "生鲜食品");
        categoryNames.put("medicine", "医药制品");
        categoryNames.put("frozen", "冷冻食品");
        categoryNames.put("dairy", "奶制品");
        categoryNames.put("produce", "水果蔬菜");
        categoryNames.put("other", "其他");
        
        alarmTypeNames = new HashMap<>();
        alarmTypeNames.put("TEMPERATURE_HIGH", "温度过高");
        alarmTypeNames.put("TEMPERATURE_LOW", "温度过低");
        alarmTypeNames.put("HUMIDITY_HIGH", "湿度过高");
        alarmTypeNames.put("HUMIDITY_LOW", "湿度过低");
        
        alarmLevelColors = new HashMap<>();
        alarmLevelColors.put("LEVEL1", new BaseColor(255, 153, 0));
        alarmLevelColors.put("LEVEL2", new BaseColor(255, 51, 0));
        alarmLevelColors.put("LEVEL3", new BaseColor(153, 0, 0));
    }
    
    public String generateTemperatureReport(Long taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        java.util.List<TemperatureData> temperatureDataList = temperatureDataRepository.findByTask_TaskId(taskId);
        java.util.List<Alarm> alarmList = alarmRepository.findByTask_TaskId(taskId);
        java.util.Optional<Inspection> inspection = inspectionRepository.findByTask_TaskId(taskId);
        
        String reportPath = "/tmp/coldchain_report_" + taskId + "_" + LocalDateTime.now().format(FILE_DATE_FORMATTER) + ".pdf";
        
        try {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, new FileOutputStream(reportPath));
            document.open();
            
            addTitle(document, "冷链物流温控报告");
            addEmptyLine(document, 1);
            
            addSectionTitle(document, "一、任务基本信息");
            addTaskInfo(document, task);
            addEmptyLine(document, 1);
            
            addSectionTitle(document, "二、温度数据记录");
            addTemperatureData(document, temperatureDataList);
            addEmptyLine(document, 1);
            
            addSectionTitle(document, "三、告警记录");
            addAlarmRecords(document, alarmList);
            addEmptyLine(document, 1);
            
            if (inspection.isPresent()) {
                addSectionTitle(document, "四、验收信息");
                addInspectionInfo(document, inspection.get());
            }
            
            addFooter(document);
            
            document.close();
            
            logger.info("Generated temperature report for task {}: {}", taskId, reportPath);
        } catch (Exception e) {
            logger.error("Error generating temperature report: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate report", e);
        }
        
        return reportPath;
    }
    
    private void addTitle(Document document, String title) throws DocumentException {
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 20, Font.BOLD, new BaseColor(0, 51, 102));
        Paragraph titleParagraph = new Paragraph(title, titleFont);
        titleParagraph.setAlignment(Element.ALIGN_CENTER);
        titleParagraph.setSpacingAfter(20);
        document.add(titleParagraph);
    }
    
    private void addSectionTitle(Document document, String title) throws DocumentException {
        Font sectionFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD, new BaseColor(0, 51, 102));
        Paragraph sectionParagraph = new Paragraph(title, sectionFont);
        sectionParagraph.setSpacingBefore(15);
        sectionParagraph.setSpacingAfter(10);
        document.add(sectionParagraph);
        
        LineSeparator line = new LineSeparator();
        line.setLineColor(new BaseColor(200, 200, 200));
        document.add(new Chunk(line));
    }
    
    private void addTaskInfo(Document document, Task task) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        
        addTableRow(table, "任务编号", String.valueOf(task.getTaskId()));
        addTableRow(table, "货主", task.getShipper() != null ? task.getShipper().getUsername() : "-");
        addTableRow(table, "承运商", task.getCarrier() != null ? task.getCarrier().getUsername() : "-");
        addTableRow(table, "司机", task.getDriver() != null ? task.getDriver().getUsername() : "-");
        addTableRow(table, "任务状态", getStatusName(task.getTaskStatus()));
        addTableRow(table, "创建时间", task.getCreatedAt() != null ? task.getCreatedAt().format(DATE_FORMATTER) : "-");
        addTableRow(table, "温度区间", formatTemperatureRange(task.getTemperatureRange()));
        addTableRow(table, "时效要求", task.getTimeLimit() != null ? task.getTimeLimit() : "-");
        addTableRow(table, "起始位置", formatLocation(task.getStartLocation()));
        addTableRow(table, "目的地", formatLocation(task.getEndLocation()));
        
        if (task.getGoodsInfo() != null) {
            addTableRow(table, "货品名称", task.getGoodsInfo().getOrDefault("name", "-").toString());
            addTableRow(table, "货品品类", getCategoryName(task.getGoodsInfo().getOrDefault("category", "").toString()));
            addTableRow(table, "货品数量", task.getGoodsInfo().getOrDefault("quantity", "-").toString());
            addTableRow(table, "货品重量", task.getGoodsInfo().getOrDefault("weight", "-").toString() + " kg");
        }
        
        document.add(table);
    }
    
    private void addTemperatureData(Document document, java.util.List<TemperatureData> temperatureDataList) throws DocumentException {
        if (temperatureDataList.isEmpty()) {
            document.add(new Paragraph("暂无温度数据记录"));
            return;
        }
        
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.WHITE);
        BaseColor headerColor = new BaseColor(0, 102, 153);
        
        addTableHeader(table, "采集时间", headerFont, headerColor);
        addTableHeader(table, "温度 (°C)", headerFont, headerColor);
        addTableHeader(table, "湿度 (%)", headerFont, headerColor);
        addTableHeader(table, "位置信息", headerFont, headerColor);
        
        Font dataFont = new Font(Font.FontFamily.HELVETICA, 9);
        
        for (int i = 0; i < Math.min(temperatureDataList.size(), 100); i++) {
            TemperatureData data = temperatureDataList.get(i);
            
            addTableCell(table, data.getCollectTime() != null ? data.getCollectTime().format(DATE_FORMATTER) : "-", dataFont);
            
            String tempStr = String.format("%.1f", data.getTemperature());
            Font tempFont = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, 
                isAbnormalTemperature(data.getTemperature()) ? BaseColor.RED : BaseColor.BLACK);
            addTableCell(table, tempStr, tempFont);
            
            addTableCell(table, data.getHumidity() != null ? String.format("%.1f", data.getHumidity()) : "-", dataFont);
            addTableCell(table, formatLocation(data.getLocation()), dataFont);
        }
        
        if (temperatureDataList.size() > 100) {
            PdfPCell moreCell = new PdfPCell(new Phrase("... 共 " + temperatureDataList.size() + " 条记录", dataFont));
            moreCell.setColspan(4);
            moreCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            moreCell.setPadding(10);
            table.addCell(moreCell);
        }
        
        document.add(table);
        
        double avgTemp = temperatureDataList.stream()
            .mapToDouble(new java.util.function.ToDoubleFunction<TemperatureData>() {
                @Override
                public double applyAsDouble(TemperatureData d) {
                    return d.getTemperature();
                }
            })
            .average().orElse(0);
        double minTemp = temperatureDataList.stream()
            .mapToDouble(new java.util.function.ToDoubleFunction<TemperatureData>() {
                @Override
                public double applyAsDouble(TemperatureData d) {
                    return d.getTemperature();
                }
            })
            .min().orElse(0);
        double maxTemp = temperatureDataList.stream()
            .mapToDouble(new java.util.function.ToDoubleFunction<TemperatureData>() {
                @Override
                public double applyAsDouble(TemperatureData d) {
                    return d.getTemperature();
                }
            })
            .max().orElse(0);
        
        PdfPTable statsTable = new PdfPTable(3);
        statsTable.setWidthPercentage(60);
        statsTable.setSpacingBefore(10);
        
        Font statsLabelFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
        Font statsValueFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, new BaseColor(0, 102, 153));
        
        addStatsCell(statsTable, "平均温度", String.format("%.1f°C", avgTemp), statsLabelFont, statsValueFont);
        addStatsCell(statsTable, "最低温度", String.format("%.1f°C", minTemp), statsLabelFont, statsValueFont);
        addStatsCell(statsTable, "最高温度", String.format("%.1f°C", maxTemp), statsLabelFont, statsValueFont);
        
        document.add(statsTable);
    }
    
    private void addAlarmRecords(Document document, java.util.List<Alarm> alarmList) throws DocumentException {
        if (alarmList.isEmpty()) {
            document.add(new Paragraph("无告警记录"));
            return;
        }
        
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, BaseColor.WHITE);
        BaseColor headerColor = new BaseColor(153, 51, 51);
        
        addTableHeader(table, "告警时间", headerFont, headerColor);
        addTableHeader(table, "告警类型", headerFont, headerColor);
        addTableHeader(table, "告警级别", headerFont, headerColor);
        addTableHeader(table, "告警值", headerFont, headerColor);
        addTableHeader(table, "阈值", headerFont, headerColor);
        addTableHeader(table, "处理状态", headerFont, headerColor);
        
        Font dataFont = new Font(Font.FontFamily.HELVETICA, 8);
        
        for (Alarm alarm : alarmList) {
            addTableCell(table, alarm.getAlarmTime() != null ? alarm.getAlarmTime().format(DATE_FORMATTER) : "-", dataFont);
            addTableCell(table, getAlarmTypeName(alarm.getAlarmType()), dataFont);
            
            Font levelFont = new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD, 
                getAlarmLevelColor(alarm.getAlarmLevel()));
            addTableCell(table, alarm.getAlarmLevel(), levelFont);
            
            addTableCell(table, String.format("%.1f°C", alarm.getAlarmValue()), dataFont);
            addTableCell(table, String.format("%.1f°C", alarm.getThresholdValue()), dataFont);
            
            Font statusFont = new Font(Font.FontFamily.HELVETICA, 8, Font.BOLD,
                "HANDLED".equals(alarm.getHandleStatus()) ? new BaseColor(0, 128, 0) : new BaseColor(204, 0, 0));
            addTableCell(table, "HANDLED".equals(alarm.getHandleStatus()) ? "已处理" : "未处理", statusFont);
        }
        
        document.add(table);
    }
    
    private void addInspectionInfo(Document document, Inspection inspection) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        
        addTableRow(table, "验收时间", inspection.getInspectionTime() != null ? 
            inspection.getInspectionTime().format(DATE_FORMATTER) : "-");
        addTableRow(table, "验收结果", "PASSED".equals(inspection.getInspectionResult()) ? "合格" : "不合格");
        addTableRow(table, "货主签名", inspection.getShipperSignature() != null ? inspection.getShipperSignature() : "-");
        addTableRow(table, "司机签名", inspection.getDriverSignature() != null ? inspection.getDriverSignature() : "-");
        
        if (inspection.getProblemDescription() != null && !inspection.getProblemDescription().isEmpty()) {
            addTableRow(table, "问题描述", inspection.getProblemDescription());
        }
        
        document.add(table);
    }
    
    private void addFooter(Document document) throws DocumentException {
        document.add(new Chunk("\n"));
        LineSeparator line = new LineSeparator();
        line.setLineColor(new BaseColor(200, 200, 200));
        document.add(new Chunk(line));
        
        Font footerFont = new Font(Font.FontFamily.HELVETICA, 9, Font.NORMAL, new BaseColor(128, 128, 128));
        Paragraph footer = new Paragraph();
        footer.setSpacingBefore(10);
        footer.add(new Phrase("报告生成时间: " + LocalDateTime.now().format(DATE_FORMATTER) + "    ", footerFont));
        footer.add(new Phrase("本报告由冷链物流温控平台自动生成，仅供参考。", footerFont));
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
    }
    
    private void addTableRow(PdfPTable table, String label, String value) throws DocumentException {
        Font labelFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
        Font valueFont = new Font(Font.FontFamily.HELVETICA, 10);
        
        PdfPCell labelCell = new PdfPCell(new Phrase(label + ":", labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPadding(5);
        table.addCell(labelCell);
        
        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPadding(5);
        table.addCell(valueCell);
    }
    
    private void addTableHeader(PdfPTable table, String text, Font font, BaseColor bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(8);
        table.addCell(cell);
    }
    
    private void addTableCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "-", font));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(5);
        table.addCell(cell);
    }
    
    private void addStatsCell(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setPadding(10);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        
        Paragraph p = new Paragraph();
        p.add(new Phrase(label + "\n", labelFont));
        p.add(new Phrase(value, valueFont));
        cell.addElement(p);
        
        table.addCell(cell);
    }
    
    private void addEmptyLine(Document document, int count) throws DocumentException {
        for (int i = 0; i < count; i++) {
            document.add(new Paragraph(" "));
        }
    }
    
    private String formatTemperatureRange(Map<String, Object> range) {
        if (range == null) return "-";
        Object min = range.get("min");
        Object max = range.get("max");
        if (min == null || max == null) return "-";
        return min + "°C ~ " + max + "°C";
    }
    
    private String formatLocation(Map<String, Object> location) {
        if (location == null) return "-";
        String address = location.getOrDefault("address", "-").toString();
        return address;
    }
    
    private String getStatusName(String status) {
        return statusNames.getOrDefault(status, status);
    }
    
    private String getCategoryName(String category) {
        return categoryNames.getOrDefault(category, category);
    }
    
    private String getAlarmTypeName(String type) {
        return alarmTypeNames.getOrDefault(type, type);
    }
    
    private BaseColor getAlarmLevelColor(String level) {
        return alarmLevelColors.getOrDefault(level, BaseColor.BLACK);
    }
    
    private boolean isAbnormalTemperature(Double temperature) {
        return temperature != null && (temperature < -25 || temperature > 10);
    }
    
    public String generateQualityReport() {
        String reportPath = "/tmp/quality_report_" + LocalDateTime.now().format(FILE_DATE_FORMATTER) + ".pdf";
        
        try {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, new FileOutputStream(reportPath));
            document.open();
            
            addTitle(document, "质控分析报表");
            addEmptyLine(document, 1);
            
            java.util.List<Task> allTasks = taskRepository.findAll();
            java.util.List<Alarm> allAlarms = alarmRepository.findAll();
            
            addSectionTitle(document, "一、总体统计");
            addQualitySummary(document, allTasks, allAlarms);
            addEmptyLine(document, 1);
            
            addSectionTitle(document, "二、任务状态分布");
            addTaskStatusDistribution(document, allTasks);
            addEmptyLine(document, 1);
            
            addSectionTitle(document, "三、告警分析");
            addAlarmAnalysis(document, allTasks, allAlarms);
            addEmptyLine(document, 1);
            
            addFooter(document);
            
            document.close();
            
            logger.info("Generated quality report: {}", reportPath);
        } catch (Exception e) {
            logger.error("Error generating quality report: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate quality report", e);
        }
        
        return reportPath;
    }
    
    private void addQualitySummary(Document document, java.util.List<Task> tasks, java.util.List<Alarm> alarms) throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);
        
        Font statsLabelFont = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
        Font statsValueFont = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, new BaseColor(0, 51, 102));
        
        long totalTasks = tasks.size();
        long completedTasks = tasks.stream().filter(t -> "COMPLETED".equals(t.getTaskStatus())).count();
        long totalAlarms = alarms.size();
        double alarmRate = totalTasks > 0 ? (totalAlarms * 100.0 / totalTasks) : 0;
        
        addStatsCell(table, "总任务数", String.valueOf(totalTasks), statsLabelFont, statsValueFont);
        addStatsCell(table, "已完成任务", String.valueOf(completedTasks), statsLabelFont, statsValueFont);
        addStatsCell(table, "告警总数", String.valueOf(totalAlarms), statsLabelFont, statsValueFont);
        addStatsCell(table, "告警率", String.format("%.1f%%", alarmRate), statsLabelFont, statsValueFont);
        
        document.add(table);
    }
    
    private void addTaskStatusDistribution(Document document, java.util.List<Task> tasks) throws DocumentException {
        Map<String, Long> statusCounts = tasks.stream()
            .collect(Collectors.groupingBy(Task::getTaskStatus, Collectors.counting()));
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(60);
        table.setSpacingBefore(10);
        
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.WHITE);
        BaseColor headerColor = new BaseColor(0, 102, 153);
        
        addTableHeader(table, "任务状态", headerFont, headerColor);
        addTableHeader(table, "数量", headerFont, headerColor);
        
        Font dataFont = new Font(Font.FontFamily.HELVETICA, 10);
        
        for (Map.Entry<String, Long> entry : statusCounts.entrySet()) {
            addTableCell(table, getStatusName(entry.getKey()), dataFont);
            addTableCell(table, String.valueOf(entry.getValue()), dataFont);
        }
        
        document.add(table);
    }
    
    private void addAlarmAnalysis(Document document, java.util.List<Task> tasks, java.util.List<Alarm> alarms) throws DocumentException {
        Map<String, Long> levelCounts = alarms.stream()
            .collect(Collectors.groupingBy(Alarm::getAlarmLevel, Collectors.counting()));
        
        Map<String, Long> typeCounts = alarms.stream()
            .collect(Collectors.groupingBy(Alarm::getAlarmType, Collectors.counting()));
        
        long handledCount = alarms.stream().filter(a -> "HANDLED".equals(a.getHandleStatus())).count();
        double handleRate = alarms.size() > 0 ? (handledCount * 100.0 / alarms.size()) : 0;
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(60);
        table.setSpacingBefore(10);
        
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.WHITE);
        BaseColor headerColor = new BaseColor(153, 51, 51);
        
        addTableHeader(table, "告警级别", headerFont, headerColor);
        addTableHeader(table, "数量", headerFont, headerColor);
        
        Font dataFont = new Font(Font.FontFamily.HELVETICA, 10);
        
        for (Map.Entry<String, Long> entry : levelCounts.entrySet()) {
            addTableCell(table, entry.getKey(), dataFont);
            addTableCell(table, String.valueOf(entry.getValue()), dataFont);
        }
        
        document.add(table);
        
        document.add(new Paragraph("\n处理率: " + String.format("%.1f%%", handleRate), 
            new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, new BaseColor(0, 128, 0))));
    }
}
