package com.guizhou.platform.certificate.service;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.RandomUtil;
import cn.hutool.crypto.SecureUtil;
import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.guizhou.platform.certificate.dto.request.CertificateIssueDTO;
import com.guizhou.platform.certificate.dto.response.CertificateDetailVO;
import com.guizhou.platform.certificate.dto.response.CertificateListVO;
import com.guizhou.platform.certificate.entity.Certificate;
import com.guizhou.platform.certificate.entity.CertificateOperationLog;
import com.guizhou.platform.certificate.enums.CertificateStatusEnum;
import com.guizhou.platform.certificate.enums.CertificateTypeEnum;
import com.guizhou.platform.certificate.mapper.CertificateMapper;
import com.guizhou.platform.certificate.mapper.CertificateOperationLogMapper;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateMapper certificateMapper;
    private final CertificateOperationLogMapper operationLogMapper;
    private final IpfsService ipfsService;
    private final BlockchainService blockchainService;
    private final StringRedisTemplate redisTemplate;
    private final MongoTemplate mongoTemplate;
    private final RocketMQTemplate rocketMQTemplate;

    @Value("${certificate.qrcode.expire-minutes:30}")
    private Integer qrcodeExpireMinutes;

    @Value("${certificate.qrcode.width:300}")
    private Integer qrcodeWidth;

    @Value("${certificate.qrcode.height:300}")
    private Integer qrcodeHeight;

    @Value("${certificate.auth-code.expire-minutes:5}")
    private Integer authCodeExpireMinutes;

    @Value("${certificate.auth-code.length:8}")
    private Integer authCodeLength;

    @Value("${certificate.expire-reminder.days-before-expire:30}")
    private Integer daysBeforeExpire;

    @Transactional(rollbackFor = Exception.class)
    public CertificateDetailVO issueCertificate(CertificateIssueDTO dto) {
        CertificateTypeEnum typeEnum = CertificateTypeEnum.getByCode(dto.getCertificateType());
        if (typeEnum == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "证照类型不存在");
        }

        LambdaQueryWrapper<Certificate> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Certificate::getCertificateNo, dto.getCertificateNo())
                .eq(Certificate::getDeleted, false);
        Long count = certificateMapper.selectCount(wrapper);
        if (count > 0) {
            throw new BusinessException(ResultCode.DATA_ALREADY_EXIST, "该证照编号已存在");
        }

        Certificate certificate = new Certificate();
        BeanUtils.copyProperties(dto, certificate);
        certificate.setCertificateName(typeEnum.getName());
        certificate.setStatus(CertificateStatusEnum.VALID.getCode());
        certificate.setIssuingAuthority(dto.getIssuingAuthority() != null ? dto.getIssuingAuthority() : typeEnum.getIssuingAuthority());

        Map<String, Object> certificateData = new HashMap<>();
        certificateData.put("certificateNo", dto.getCertificateNo());
        certificateData.put("certificateType", dto.getCertificateType());
        certificateData.put("userName", dto.getUserName());
        certificateData.put("idCardNo", dto.getIdCardNo());
        certificateData.put("issueDate", dto.getIssueDate());
        certificateData.put("expireDate", dto.getExpireDate());
        certificateData.put("metadata", dto.getMetadata());
        certificateData.put("timestamp", System.currentTimeMillis());

        String dataHash = SecureUtil.sha256(JSON.toJSONString(certificateData));
        certificate.setDataHash(dataHash);

        String ipfsHash = ipfsService.uploadJson(certificateData);
        certificate.setIpfsHash(ipfsHash);
        ipfsService.pin(ipfsHash);

        Map<String, Object> blockchainMeta = new HashMap<>();
        blockchainMeta.put("certificateType", dto.getCertificateType());
        blockchainMeta.put("userName", dto.getUserName());
        String blockchainTxHash = blockchainService.storeCertificate(dto.getCertificateNo(), dataHash, ipfsHash, blockchainMeta);
        certificate.setBlockchainTxHash(blockchainTxHash);

        if (dto.getMetadata() != null) {
            certificate.setMetadata(JSON.toJSONString(dto.getMetadata()));
        }
        if (dto.getExtendInfo() != null) {
            certificate.setExtendInfo(JSON.toJSONString(dto.getExtendInfo()));
        }

        certificateMapper.insert(certificate);

        saveOperationLog(certificate.getId(), certificate.getCertificateNo(), "ISSUE", "签发电子证照", dto.getUserId(), dto.getUserName());

        mongoTemplate.save(certificateData, "certificate_data_" + certificate.getId());

        rocketMQTemplate.convertAndSend("certificate-issue-topic", Map.of(
                "certificateId", certificate.getId(),
                "certificateNo", certificate.getCertificateNo(),
                "userId", dto.getUserId(),
                "userName", dto.getUserName(),
                "issueTime", LocalDateTime.now()
        ));

        log.info("电子证照签发成功，证照ID: {}, 证照编号: {}", certificate.getId(), certificate.getCertificateNo());
        return convertToDetailVO(certificate);
    }

    public CertificateDetailVO getCertificateDetail(Long id) {
        Certificate certificate = certificateMapper.selectById(id);
        if (certificate == null || certificate.getDeleted()) {
            throw new BusinessException(ResultCode.CERTIFICATE_NOT_EXIST);
        }
        return convertToDetailVO(certificate);
    }

    public PageResult<CertificateListVO> getCertificateList(Long userId, Integer certificateType, Integer status, PageQuery pageQuery) {
        LambdaQueryWrapper<Certificate> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Certificate::getDeleted, false);
        if (userId != null) {
            wrapper.eq(Certificate::getUserId, userId);
        }
        if (certificateType != null) {
            wrapper.eq(Certificate::getCertificateType, certificateType);
        }
        if (status != null) {
            wrapper.eq(Certificate::getStatus, status);
        }
        wrapper.orderByDesc(Certificate::getCreateTime);

        Page<Certificate> page = new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize());
        IPage<Certificate> resultPage = certificateMapper.selectPage(page, wrapper);

        return PageResult.of(
                resultPage.getTotal(),
                resultPage.getRecords().stream().map(this::convertToListVO).toList(),
                pageQuery.getPageNum(),
                pageQuery.getPageSize()
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public void revokeCertificate(Long id, String reason, Long operatorId, String operatorName) {
        Certificate certificate = certificateMapper.selectById(id);
        if (certificate == null || certificate.getDeleted()) {
            throw new BusinessException(ResultCode.CERTIFICATE_NOT_EXIST);
        }
        if (CertificateStatusEnum.REVOKED.getCode().equals(certificate.getStatus())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "证照已吊销");
        }

        certificate.setStatus(CertificateStatusEnum.REVOKED.getCode());
        certificateMapper.updateById(certificate);

        blockchainService.revokeCertificate(certificate.getCertificateNo(), reason);

        saveOperationLog(certificate.getId(), certificate.getCertificateNo(), "REVOKE", "吊销证照，原因: " + reason, operatorId, operatorName);

        rocketMQTemplate.convertAndSend("certificate-revoke-topic", Map.of(
                "certificateId", id,
                "certificateNo", certificate.getCertificateNo(),
                "reason", reason,
                "operatorId", operatorId,
                "operatorName", operatorName,
                "revokeTime", LocalDateTime.now()
        ));

        log.info("电子证照吊销成功，证照ID: {}", id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void archiveCertificate(Long id, Long operatorId, String operatorName) {
        Certificate certificate = certificateMapper.selectById(id);
        if (certificate == null || certificate.getDeleted()) {
            throw new BusinessException(ResultCode.CERTIFICATE_NOT_EXIST);
        }

        certificate.setStatus(CertificateStatusEnum.ARCHIVED.getCode());
        certificateMapper.updateById(certificate);

        saveOperationLog(certificate.getId(), certificate.getCertificateNo(), "ARCHIVE", "归档证照", operatorId, operatorName);

        log.info("电子证照归档成功，证照ID: {}", id);
    }

    public String generateQrcode(Long certificateId, Long userId) {
        Certificate certificate = certificateMapper.selectById(certificateId);
        if (certificate == null || certificate.getDeleted()) {
            throw new BusinessException(ResultCode.CERTIFICATE_NOT_EXIST);
        }
        if (!CertificateStatusEnum.VALID.getCode().equals(certificate.getStatus())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "证照状态无效");
        }
        if (!certificate.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.PERMISSION_DENIED, "无权生成该证照的二维码");
        }

        String token = IdUtil.fastSimpleUUID();
        String key = "certificate:qrcode:" + token;
        Map<String, Object> qrcodeData = Map.of(
                "certificateId", certificateId,
                "certificateNo", certificate.getCertificateNo(),
                "userId", userId,
                "createTime", System.currentTimeMillis()
        );
        redisTemplate.opsForValue().set(key, JSON.toJSONString(qrcodeData), qrcodeExpireMinutes, TimeUnit.MINUTES);

        String qrcodeContent = "certificate://verify?token=" + token + "&t=" + System.currentTimeMillis();

        try {
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);

            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrcodeContent, BarcodeFormat.QR_CODE, qrcodeWidth, qrcodeHeight, hints);

            BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ImageIO.write(bufferedImage, "PNG", outputStream);

            String base64Image = Base64.getEncoder().encodeToString(outputStream.toByteArray());
            return "data:image/png;base64," + base64Image;
        } catch (Exception e) {
            log.error("生成二维码失败", e);
            throw new RuntimeException("生成二维码失败", e);
        }
    }

    public String generateAuthCode(Long certificateId, Long userId) {
        Certificate certificate = certificateMapper.selectById(certificateId);
        if (certificate == null || certificate.getDeleted()) {
            throw new BusinessException(ResultCode.CERTIFICATE_NOT_EXIST);
        }
        if (!CertificateStatusEnum.VALID.getCode().equals(certificate.getStatus())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "证照状态无效");
        }
        if (!certificate.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.PERMISSION_DENIED, "无权生成该证照的授权码");
        }

        String authCode = RandomUtil.randomNumbers(authCodeLength);
        String key = "certificate:authcode:" + authCode;
        Map<String, Object> authCodeData = Map.of(
                "certificateId", certificateId,
                "certificateNo", certificate.getCertificateNo(),
                "userId", userId,
                "createTime", System.currentTimeMillis()
        );
        redisTemplate.opsForValue().set(key, JSON.toJSONString(authCodeData), authCodeExpireMinutes, TimeUnit.MINUTES);

        saveOperationLog(certificateId, certificate.getCertificateNo(), "GENERATE_AUTH_CODE", "生成授权码: " + authCode, userId, certificate.getUserName());

        return authCode;
    }

    @Scheduled(cron = "${certificate.expire-reminder.cron:0 0 8 * * ?}")
    public void expireReminderTask() {
        log.info("开始执行证照过期提醒任务");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = now.plusDays(daysBeforeExpire);
        LocalDateTime endTime = startTime.plusDays(1);

        var certificates = certificateMapper.selectExpiringCertificates(startTime, endTime);
        log.info("发现{}个即将过期的证照", certificates.size());

        for (Certificate certificate : certificates) {
            rocketMQTemplate.convertAndSend("certificate-expire-reminder-topic", Map.of(
                    "certificateId", certificate.getId(),
                    "certificateNo", certificate.getCertificateNo(),
                    "certificateName", certificate.getCertificateName(),
                    "userId", certificate.getUserId(),
                    "userName", certificate.getUserName(),
                    "expireDate", certificate.getExpireDate(),
                    "daysRemaining", java.time.Duration.between(now, certificate.getExpireDate()).toDays()
            ));
        }

        var expiredCertificates = certificateMapper.selectExpiredCertificates(now);
        log.info("发现{}个已过期的证照，自动更新状态", expiredCertificates.size());
        for (Certificate certificate : expiredCertificates) {
            certificate.setStatus(CertificateStatusEnum.EXPIRED.getCode());
            certificateMapper.updateById(certificate);
        }

        log.info("证照过期提醒任务执行完成");
    }

    private void saveOperationLog(Long certificateId, String certificateNo, String operationType, String operationContent, Long operatorId, String operatorName) {
        CertificateOperationLog operationLog = new CertificateOperationLog();
        operationLog.setCertificateId(certificateId);
        operationLog.setCertificateNo(certificateNo);
        operationLog.setOperationType(operationType);
        operationLog.setOperationContent(operationContent);
        operationLog.setOperatorId(operatorId);
        operationLog.setOperatorName(operatorName);
        operationLog.setOperationTime(LocalDateTime.now());
        operationLogMapper.insert(operationLog);
    }

    private CertificateDetailVO convertToDetailVO(Certificate certificate) {
        CertificateDetailVO vo = new CertificateDetailVO();
        BeanUtils.copyProperties(certificate, vo);

        CertificateTypeEnum typeEnum = CertificateTypeEnum.getByCode(certificate.getCertificateType());
        if (typeEnum != null) {
            vo.setCertificateTypeName(typeEnum.getName());
        }

        CertificateStatusEnum statusEnum = CertificateStatusEnum.getByCode(certificate.getStatus());
        if (statusEnum != null) {
            vo.setStatusName(statusEnum.getName());
        }

        vo.setIpfsUrl(ipfsService.getGatewayUrl(certificate.getIpfsHash()));
        vo.setBlockchainUrl(blockchainService.getTransactionUrl(certificate.getBlockchainTxHash()));

        if (certificate.getMetadata() != null) {
            vo.setMetadata(JSON.parseObject(certificate.getMetadata(), Map.class));
        }
        if (certificate.getExtendInfo() != null) {
            vo.setExtendInfo(JSON.parseObject(certificate.getExtendInfo(), Map.class));
        }

        return vo;
    }

    private CertificateListVO convertToListVO(Certificate certificate) {
        CertificateListVO vo = new CertificateListVO();
        BeanUtils.copyProperties(certificate, vo);

        CertificateTypeEnum typeEnum = CertificateTypeEnum.getByCode(certificate.getCertificateType());
        if (typeEnum != null) {
            vo.setCertificateTypeName(typeEnum.getName());
        }

        CertificateStatusEnum statusEnum = CertificateStatusEnum.getByCode(certificate.getStatus());
        if (statusEnum != null) {
            vo.setStatusName(statusEnum.getName());
        }

        return vo;
    }
}
