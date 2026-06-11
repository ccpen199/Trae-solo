package com.guizhou.platform.subsidyverify.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.common.result.ResultCode;
import com.guizhou.platform.subsidyverify.dto.request.VerifyRequestDTO;
import com.guizhou.platform.subsidyverify.dto.response.VerifyResultVO;
import com.guizhou.platform.subsidyverify.entity.Merchant;
import com.guizhou.platform.subsidyverify.entity.SubsidyVoucher;
import com.guizhou.platform.subsidyverify.entity.VerifyRecord;
import com.guizhou.platform.subsidyverify.enums.MerchantStatusEnum;
import com.guizhou.platform.subsidyverify.enums.VerifyStatusEnum;
import com.guizhou.platform.subsidyverify.enums.VoucherStatusEnum;
import com.guizhou.platform.subsidyverify.mapper.MerchantMapper;
import com.guizhou.platform.subsidyverify.mapper.SubsidyVoucherMapper;
import com.guizhou.platform.subsidyverify.mapper.VerifyRecordMapper;
import com.guizhou.platform.subsidyverify.service.SubsidyClientService;
import com.guizhou.platform.subsidyverify.service.VerifyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerifyServiceImpl extends ServiceImpl<VerifyRecordMapper, VerifyRecord> implements VerifyService {

    private final MerchantMapper merchantMapper;
    private final SubsidyVoucherMapper voucherMapper;
    private final SubsidyClientService subsidyClientService;
    private final RocketMQTemplate rocketMQTemplate;
    private final StringRedisTemplate redisTemplate;

    private static final String VERIFY_LOCK_PREFIX = "verify:lock:";
    private static final DateTimeFormatter VERIFY_NO_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    @Override
    @Transactional(rollbackFor = Exception.class)
    public VerifyResultVO scanVerify(VerifyRequestDTO dto) {
        dto.setVerifyType(1);
        return doVerify(dto);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public VerifyResultVO manualVerify(VerifyRequestDTO dto) {
        dto.setVerifyType(2);
        return doVerify(dto);
    }

    @Override
    public VerifyResultVO getVerifyDetail(Long id) {
        VerifyRecord record = getById(id);
        if (record == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "核销记录不存在");
        }
        return convertToVO(record);
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
    @Transactional(rollbackFor = Exception.class)
    public void cancelVerify(Long id, String reason) {
        VerifyRecord record = getById(id);
        if (record == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "核销记录不存在");
        }
        if (!VerifyStatusEnum.SUCCESS.getCode().equals(record.getVerifyStatus())) {
            throw new BusinessException("仅可撤销核销成功的记录");
        }

        int rows = voucherMapper.deductAmount(record.getVoucherId(), record.getSubsidyAmount().negate());
        if (rows <= 0) {
            throw new BusinessException("退还凭证金额失败");
        }

        record.setVerifyStatus(VerifyStatusEnum.CANCELLED.getCode());
        record.setRemark(reason);
        updateById(record);

        merchantMapper.incrementVerifyCount(record.getMerchantId());

        sendVerifyMessage(record, "CANCELLED");
        log.info("核销撤销成功, verifyNo={}", record.getVerifyNo());
    }

    private VerifyResultVO doVerify(VerifyRequestDTO dto) {
        String lockKey = VERIFY_LOCK_PREFIX + dto.getVoucherId();
        Boolean locked = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 30, TimeUnit.SECONDS);
        if (Boolean.FALSE.equals(locked)) {
            throw new BusinessException("该凭证正在核销中，请稍后重试");
        }
        try {
            SubsidyVoucher voucher = voucherMapper.selectById(dto.getVoucherId());
            validateVoucher(voucher, dto.getSubsidyAmount());

            Merchant merchant = merchantMapper.selectById(dto.getMerchantId());
            validateMerchant(merchant);

            boolean eligible = subsidyClientService.verifyEligibility(voucher.getBeneficiaryId(), voucher.getPolicyId());
            if (!eligible) {
                throw new BusinessException(ResultCode.SUBSIDY_NOT_ELIGIBLE);
            }

            VerifyRecord record = buildVerifyRecord(dto, voucher, merchant);
            record.setVerifyStatus(VerifyStatusEnum.VERIFYING.getCode());
            save(record);

            int rows = voucherMapper.deductAmount(voucher.getId(), dto.getSubsidyAmount());
            if (rows <= 0) {
                record.setVerifyStatus(VerifyStatusEnum.FAILED.getCode());
                record.setRemark("凭证余额扣减失败");
                updateById(record);
                throw new BusinessException(ResultCode.SUBSIDY_VERIFY_FAILED, "凭证余额不足或扣减失败");
            }

            boolean deducted = subsidyClientService.deductBalance(voucher.getPolicyId(), dto.getSubsidyAmount());
            if (!deducted) {
                record.setVerifyStatus(VerifyStatusEnum.FAILED.getCode());
                record.setRemark("补贴监管服务扣减余额失败");
                updateById(record);
                throw new BusinessException(ResultCode.SUBSIDY_VERIFY_FAILED, "补贴监管服务扣减余额失败");
            }

            record.setVerifyStatus(VerifyStatusEnum.SUCCESS.getCode());
            record.setVerifyTime(LocalDateTime.now());
            record.setCertificateNo(generateCertificateNo());
            record.setTransactionNo(generateTransactionNo());
            updateById(record);

            merchantMapper.incrementVerifyCount(merchant.getId());

            sendVerifyMessage(record, "SUCCESS");

            log.info("核销成功, verifyNo={}, voucherNo={}, merchant={}",
                    record.getVerifyNo(), voucher.getVoucherNo(), merchant.getMerchantName());
            return convertToVO(record);
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    private void validateVoucher(SubsidyVoucher voucher, BigDecimal subsidyAmount) {
        if (voucher == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "补贴凭证不存在");
        }
        if (VoucherStatusEnum.EXPIRED.getCode().equals(voucher.getVoucherStatus())) {
            throw new BusinessException("补贴凭证已过期");
        }
        if (VoucherStatusEnum.CANCELLED.getCode().equals(voucher.getVoucherStatus())) {
            throw new BusinessException("补贴凭证已作废");
        }
        if (VoucherStatusEnum.USED.getCode().equals(voucher.getVoucherStatus())) {
            throw new BusinessException("补贴凭证已全部使用");
        }
        if (voucher.getRemainingAmount().compareTo(subsidyAmount) < 0) {
            throw new BusinessException("补贴凭证余额不足");
        }
        if (voucher.getExpiryTime() != null && voucher.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new BusinessException("补贴凭证已过期");
        }
        if (voucher.getEffectiveTime() != null && voucher.getEffectiveTime().isAfter(LocalDateTime.now())) {
            throw new BusinessException("补贴凭证尚未生效");
        }
    }

    private void validateMerchant(Merchant merchant) {
        if (merchant == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "商户不存在");
        }
        if (!MerchantStatusEnum.APPROVED.getCode().equals(merchant.getStatus())) {
            throw new BusinessException("商户未通过审核，无法核销");
        }
    }

    private VerifyRecord buildVerifyRecord(VerifyRequestDTO dto, SubsidyVoucher voucher, Merchant merchant) {
        VerifyRecord record = new VerifyRecord();
        record.setVerifyNo(generateVerifyNo());
        record.setVoucherId(voucher.getId());
        record.setVoucherNo(voucher.getVoucherNo());
        record.setPolicyId(voucher.getPolicyId());
        record.setPolicyCode(voucher.getPolicyCode());
        record.setPolicyName(voucher.getPolicyName());
        record.setBeneficiaryId(voucher.getBeneficiaryId());
        record.setBeneficiaryName(voucher.getBeneficiaryName());
        record.setIdCard(voucher.getIdCard());
        record.setMerchantId(merchant.getId());
        record.setMerchantName(merchant.getMerchantName());
        record.setMerchantCode(merchant.getMerchantCode());
        record.setMerchantCategory(merchant.getCategoryCode());
        record.setOriginalAmount(dto.getOriginalAmount());
        record.setSubsidyAmount(dto.getSubsidyAmount());
        record.setSelfPayAmount(dto.getSelfPayAmount() != null ? dto.getSelfPayAmount() :
                dto.getOriginalAmount().subtract(dto.getSubsidyAmount()));
        record.setVerifyType(dto.getVerifyType());
        record.setVerifyPlace(dto.getVerifyPlace());
        record.setVerifyDevice(dto.getVerifyDevice());
        record.setVerifyItems(dto.getVerifyItems());
        record.setRemark(dto.getRemark());
        return record;
    }

    private String generateVerifyNo() {
        return "VF" + LocalDateTime.now().format(VERIFY_NO_FORMATTER) + IdUtil.simpleUUID().substring(0, 6).toUpperCase();
    }

    private String generateCertificateNo() {
        return "CT" + LocalDateTime.now().format(VERIFY_NO_FORMATTER) + IdUtil.simpleUUID().substring(0, 6).toUpperCase();
    }

    private String generateTransactionNo() {
        return "TX" + IdUtil.getSnowflakeNextIdStr();
    }

    private void sendVerifyMessage(VerifyRecord record, String action) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("verifyNo", record.getVerifyNo());
            message.put("voucherNo", record.getVoucherNo());
            message.put("merchantId", record.getMerchantId());
            message.put("beneficiaryId", record.getBeneficiaryId());
            message.put("subsidyAmount", record.getSubsidyAmount());
            message.put("action", action);
            message.put("timestamp", System.currentTimeMillis());
            rocketMQTemplate.convertAndSend("subsidy-verify-topic", message);
        } catch (Exception e) {
            log.error("发送核销消息失败, verifyNo={}", record.getVerifyNo(), e);
        }
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
