package com.guizhou.platform.subsidyverify.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.common.result.ResultCode;
import com.guizhou.platform.subsidyverify.dto.response.VerifyResultVO;
import com.guizhou.platform.subsidyverify.entity.VerifyRecord;
import com.guizhou.platform.subsidyverify.enums.VerifyStatusEnum;
import com.guizhou.platform.subsidyverify.mapper.VerifyRecordMapper;
import com.guizhou.platform.subsidyverify.service.VerifyRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerifyRecordServiceImpl extends ServiceImpl<VerifyRecordMapper, VerifyRecord> implements VerifyRecordService {

    @Override
    public VerifyResultVO getDetail(Long id) {
        VerifyRecord record = getById(id);
        if (record == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "核销记录不存在");
        }
        return convertToVO(record);
    }

    @Override
    public List<VerifyResultVO> listByVoucher(Long voucherId) {
        List<VerifyRecord> records = list(new LambdaQueryWrapper<VerifyRecord>()
                .eq(VerifyRecord::getVoucherId, voucherId)
                .orderByDesc(VerifyRecord::getVerifyTime));
        return records.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public List<VerifyResultVO> listByBeneficiary(Long beneficiaryId) {
        List<VerifyRecord> records = list(new LambdaQueryWrapper<VerifyRecord>()
                .eq(VerifyRecord::getBeneficiaryId, beneficiaryId)
                .orderByDesc(VerifyRecord::getVerifyTime));
        return records.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public List<VerifyResultVO> listByMerchant(Long merchantId) {
        List<VerifyRecord> records = list(new LambdaQueryWrapper<VerifyRecord>()
                .eq(VerifyRecord::getMerchantId, merchantId)
                .orderByDesc(VerifyRecord::getVerifyTime));
        return records.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getDailyTrend(int days) {
        LocalDateTime startTime = LocalDateTime.now().minusDays(days);
        List<Map<String, Object>> trend = baseMapper.getDailyVerifyTrend(startTime);
        Map<String, Object> result = new HashMap<>();
        result.put("trend", trend);
        result.put("startDate", startTime.toLocalDate().toString());
        result.put("endDate", LocalDateTime.now().toLocalDate().toString());
        return result;
    }

    private VerifyResultVO convertToVO(VerifyRecord record) {
        VerifyResultVO vo = new VerifyResultVO();
        BeanUtils.copyProperties(record, vo);
        VerifyStatusEnum statusEnum = VerifyStatusEnum.getByCode(record.getVerifyStatus());
        if (statusEnum != null) {
            vo.setVerifyStatusDesc(statusEnum.getDesc());
        }
        return vo;
    }
}
