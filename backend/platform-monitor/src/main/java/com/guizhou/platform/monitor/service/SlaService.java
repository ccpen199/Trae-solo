package com.guizhou.platform.monitor.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.monitor.dto.request.SlaAgreementDTO;
import com.guizhou.platform.monitor.dto.response.SlaReportVO;
import com.guizhou.platform.monitor.entity.ProbeRecord;
import com.guizhou.platform.monitor.entity.SlaAgreement;
import com.guizhou.platform.monitor.entity.SlaRecord;
import com.guizhou.platform.monitor.enums.SlaStatusEnum;
import com.guizhou.platform.monitor.mapper.ProbeRecordMapper;
import com.guizhou.platform.monitor.mapper.SlaAgreementMapper;
import com.guizhou.platform.monitor.mapper.SlaRecordMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaService {

    private final SlaAgreementMapper slaAgreementMapper;
    private final SlaRecordMapper slaRecordMapper;
    private final ProbeRecordMapper probeRecordMapper;

    public SlaAgreement createAgreement(SlaAgreementDTO dto) {
        SlaAgreement agreement = new SlaAgreement();
        BeanUtils.copyProperties(dto, agreement);
        agreement.setAgreementCode("SLA" + System.currentTimeMillis());
        agreement.setStatus("ACTIVE");
        slaAgreementMapper.insert(agreement);
        return agreement;
    }

    public SlaAgreement updateAgreement(Long agreementId, SlaAgreementDTO dto) {
        SlaAgreement agreement = slaAgreementMapper.selectById(agreementId);
        if (agreement == null) {
            throw new RuntimeException("SLA协议不存在");
        }
        BeanUtils.copyProperties(dto, agreement);
        agreement.setId(agreementId);
        slaAgreementMapper.updateById(agreement);
        return agreement;
    }

    public void deleteAgreement(Long agreementId) {
        slaAgreementMapper.deleteById(agreementId);
    }

    public IPage<SlaAgreement> listAgreements(int pageNum, int pageSize) {
        return slaAgreementMapper.selectPage(
                new Page<>(pageNum, pageSize),
                new LambdaQueryWrapper<SlaAgreement>().orderByDesc(SlaAgreement::getCreateTime)
        );
    }

    public SlaAgreement getAgreement(Long agreementId) {
        return slaAgreementMapper.selectById(agreementId);
    }

    public IPage<SlaReportVO> getSlaRecords(String serviceCode, LocalDate checkMonth, int pageNum, int pageSize) {
        LambdaQueryWrapper<SlaRecord> wrapper = new LambdaQueryWrapper<>();
        if (serviceCode != null) {
            wrapper.eq(SlaRecord::getServiceCode, serviceCode);
        }
        if (checkMonth != null) {
            wrapper.eq(SlaRecord::getCheckMonth, checkMonth);
        }
        wrapper.orderByDesc(SlaRecord::getCheckMonth);

        IPage<SlaRecord> page = slaRecordMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
        return page.convert(this::convertToSlaReportVO);
    }

    @Transactional
    public void executeMonthlyCheck() {
        log.info("开始执行SLA月度考核...");
        LocalDate lastMonth = YearMonth.now().minusMonths(1).atDay(1);

        List<SlaAgreement> activeAgreements = slaAgreementMapper.selectList(
                new LambdaQueryWrapper<SlaAgreement>().eq(SlaAgreement::getStatus, "ACTIVE")
        );

        for (SlaAgreement agreement : activeAgreements) {
            try {
                SlaRecord record = calculateMonthlyRecord(agreement, lastMonth);
                slaRecordMapper.insert(record);
                log.info("SLA考核完成: 服务[{}] 月份[{}] 可用性[{}%] 结果[{}]",
                        agreement.getServiceCode(), lastMonth,
                        record.getActualAvailability(), record.getCheckStatus());
            } catch (Exception e) {
                log.error("SLA考核失败: 服务[{}] 月份[{}] 错误[{}]",
                        agreement.getServiceCode(), lastMonth, e.getMessage());
            }
        }
        log.info("SLA月度考核执行完毕，共考核{}个协议", activeAgreements.size());
    }

    private SlaRecord calculateMonthlyRecord(SlaAgreement agreement, LocalDate checkMonth) {
        YearMonth yearMonth = YearMonth.from(checkMonth);
        LocalDateTime monthStart = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = yearMonth.atEndOfMonth().atTime(LocalTime.MAX);

        List<ProbeRecord> probes = probeRecordMapper.selectList(
                new LambdaQueryWrapper<ProbeRecord>()
                        .eq(ProbeRecord::getServiceCode, agreement.getServiceCode())
                        .ge(ProbeRecord::getProbeTime, monthStart)
                        .le(ProbeRecord::getProbeTime, monthEnd)
        );

        SlaRecord record = new SlaRecord();
        record.setAgreementId(agreement.getId());
        record.setAgreementCode(agreement.getAgreementCode());
        record.setServiceId(agreement.getServiceId());
        record.setServiceCode(agreement.getServiceCode());
        record.setServiceName(agreement.getServiceName());
        record.setCheckMonth(checkMonth);
        record.setAvailabilityTarget(agreement.getAvailabilityTarget());
        record.setResponseTimeTarget(agreement.getResponseTimeTarget());
        record.setErrorRateTarget(agreement.getErrorRateTarget());

        long totalMinutes = yearMonth.lengthOfMonth() * 24L * 60;
        record.setTotalMinutes(BigDecimal.valueOf(totalMinutes));

        if (probes.isEmpty()) {
            record.setDowntimeMinutes(BigDecimal.valueOf(totalMinutes));
            record.setActualAvailability(BigDecimal.ZERO);
            record.setAvgResponseTime(BigDecimal.ZERO);
            record.setErrorRate(new BigDecimal("100"));
            record.setTotalRequests(0L);
            record.setFailedRequests(0L);
            record.setCheckStatus(SlaStatusEnum.UNQUALIFIED.getCode());
            record.setCheckResult("无拨测数据，考核不达标");
            return record;
        }

        long totalRequests = probes.size();
        long failedRequests = probes.stream().filter(p -> !p.getSuccess()).count();
        long successRequests = totalRequests - failedRequests;

        BigDecimal avgResponseTime = BigDecimal.valueOf(
                probes.stream().filter(ProbeRecord::getSuccess)
                        .mapToLong(ProbeRecord::getResponseTime).average().orElse(0.0)
        ).setScale(2, RoundingMode.HALF_UP);

        BigDecimal errorRate = BigDecimal.valueOf((double) failedRequests / totalRequests * 100)
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal availability = BigDecimal.valueOf((double) successRequests / totalRequests * 100)
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal downtimeMinutes = BigDecimal.valueOf(totalMinutes)
                .multiply(BigDecimal.ONE.subtract(availability.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)))
                .setScale(2, RoundingMode.HALF_UP);

        record.setDowntimeMinutes(downtimeMinutes);
        record.setActualAvailability(availability);
        record.setAvgResponseTime(avgResponseTime);
        record.setErrorRate(errorRate);
        record.setTotalRequests(totalRequests);
        record.setFailedRequests(failedRequests);

        boolean availabilityOk = availability.compareTo(agreement.getAvailabilityTarget()) >= 0;
        boolean responseTimeOk = avgResponseTime.compareTo(agreement.getResponseTimeTarget()) <= 0;
        boolean errorRateOk = errorRate.compareTo(agreement.getErrorRateTarget()) <= 0;

        if (availabilityOk && responseTimeOk && errorRateOk) {
            record.setCheckStatus(SlaStatusEnum.QUALIFIED.getCode());
            record.setCheckResult("SLA考核达标");
        } else {
            record.setCheckStatus(SlaStatusEnum.UNQUALIFIED.getCode());
            StringBuilder result = new StringBuilder("SLA考核未达标：");
            if (!availabilityOk) result.append(String.format("可用性[%s%%<%s%%] ", availability, agreement.getAvailabilityTarget()));
            if (!responseTimeOk) result.append(String.format("响应时间[%sms>%sms] ", avgResponseTime, agreement.getResponseTimeTarget()));
            if (!errorRateOk) result.append(String.format("错误率[%s%%>%s%%] ", errorRate, agreement.getErrorRateTarget()));
            record.setCheckResult(result.toString());
        }

        return record;
    }

    private SlaReportVO convertToSlaReportVO(SlaRecord record) {
        SlaReportVO vo = new SlaReportVO();
        BeanUtils.copyProperties(record, vo);
        return vo;
    }
}
