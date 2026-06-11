package com.guizhou.platform.certificate.service;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guizhou.platform.certificate.dto.request.CertificateVerifyDTO;
import com.guizhou.platform.certificate.dto.response.VerifyResultVO;
import com.guizhou.platform.certificate.entity.Certificate;
import com.guizhou.platform.certificate.entity.CertificateVerifyLog;
import com.guizhou.platform.certificate.enums.CertificateStatusEnum;
import com.guizhou.platform.certificate.enums.VerifyTypeEnum;
import com.guizhou.platform.certificate.mapper.CertificateMapper;
import com.guizhou.platform.certificate.mapper.CertificateVerifyLogMapper;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.common.result.ResultCode;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerifyService {

    private final CertificateMapper certificateMapper;
    private final CertificateVerifyLogMapper verifyLogMapper;
    private final BlockchainService blockchainService;
    private final OcrService ocrService;
    private final IpfsService ipfsService;
    private final StringRedisTemplate redisTemplate;
    private final RocketMQTemplate rocketMQTemplate;
    private final HttpServletRequest request;

    @Transactional(rollbackFor = Exception.class)
    public VerifyResultVO verify(CertificateVerifyDTO dto) {
        VerifyTypeEnum verifyTypeEnum = VerifyTypeEnum.getByCode(dto.getVerifyType());
        if (verifyTypeEnum == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "核验方式不存在");
        }

        VerifyResultVO result;

        try {
            result = switch (verifyTypeEnum) {
                case QRCODE -> verifyByQrcode(dto);
                case OCR -> verifyByOcr(dto);
                case AUTH_CODE -> verifyByAuthCode(dto);
                case FACE_RECOGNITION -> verifyByFace(dto);
            };
        } catch (Exception e) {
            log.error("证照核验异常", e);
            result = VerifyResultVO.fail("核验系统异常");
        }

        result.setVerifyType(dto.getVerifyType());
        result.setVerifyTypeName(verifyTypeEnum.getName());

        saveVerifyLog(dto, result);

        sendVerifyMessage(dto, result);

        return result;
    }

    private VerifyResultVO verifyByQrcode(CertificateVerifyDTO dto) {
        if (StrUtil.isBlank(dto.getQrcodeContent())) {
            return VerifyResultVO.fail("二维码内容不能为空");
        }

        String token = extractTokenFromQrcode(dto.getQrcodeContent());
        if (StrUtil.isBlank(token)) {
            return VerifyResultVO.fail("二维码内容无效");
        }

        String key = "certificate:qrcode:" + token;
        String cachedData = redisTemplate.opsForValue().get(key);
        if (StrUtil.isBlank(cachedData)) {
            return VerifyResultVO.fail("二维码已过期或无效");
        }

        Map<String, Object> data = JSON.parseObject(cachedData, Map.class);
        Long certificateId = Long.valueOf(data.get("certificateId").toString());
        String certificateNo = data.get("certificateNo").toString();

        Certificate certificate = certificateMapper.selectById(certificateId);
        return verifyCertificate(certificate, certificateNo, dto);
    }

    private VerifyResultVO verifyByAuthCode(CertificateVerifyDTO dto) {
        if (StrUtil.isBlank(dto.getAuthCode())) {
            return VerifyResultVO.fail("授权码不能为空");
        }

        String key = "certificate:authcode:" + dto.getAuthCode();
        String cachedData = redisTemplate.opsForValue().get(key);
        if (StrUtil.isBlank(cachedData)) {
            return VerifyResultVO.fail("授权码已过期或无效");
        }

        Map<String, Object> data = JSON.parseObject(cachedData, Map.class);
        Long certificateId = Long.valueOf(data.get("certificateId").toString());
        String certificateNo = data.get("certificateNo").toString();

        redisTemplate.delete(key);

        Certificate certificate = certificateMapper.selectById(certificateId);
        return verifyCertificate(certificate, certificateNo, dto);
    }

    private VerifyResultVO verifyByOcr(CertificateVerifyDTO dto) {
        if (StrUtil.isBlank(dto.getOcrImageBase64())) {
            return VerifyResultVO.fail("OCR图片不能为空");
        }

        if (StrUtil.isBlank(dto.getCertificateNo())) {
            return VerifyResultVO.fail("证照编号不能为空");
        }

        Map<String, Object> ocrResult = ocrService.recognizeIdCard(dto.getOcrImageBase64());
        String ocrIdCardNo = (String) ocrResult.get("idCardNo");

        if (StrUtil.isBlank(ocrIdCardNo)) {
            return VerifyResultVO.fail("OCR识别失败，无法获取身份证号");
        }

        LambdaQueryWrapper<Certificate> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Certificate::getCertificateNo, dto.getCertificateNo())
                .eq(Certificate::getDeleted, false);
        Certificate certificate = certificateMapper.selectOne(wrapper);

        if (certificate == null) {
            return VerifyResultVO.fail("证照不存在");
        }

        if (!ocrIdCardNo.equals(certificate.getIdCardNo())) {
            return VerifyResultVO.fail("证照信息与OCR识别结果不匹配");
        }

        return verifyCertificate(certificate, dto.getCertificateNo(), dto);
    }

    private VerifyResultVO verifyByFace(CertificateVerifyDTO dto) {
        if (StrUtil.isBlank(dto.getCertificateNo())) {
            return VerifyResultVO.fail("证照编号不能为空");
        }
        if (StrUtil.isBlank(dto.getFaceImageBase64())) {
            return VerifyResultVO.fail("人脸图片不能为空");
        }

        LambdaQueryWrapper<Certificate> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Certificate::getCertificateNo, dto.getCertificateNo())
                .eq(Certificate::getDeleted, false);
        Certificate certificate = certificateMapper.selectOne(wrapper);

        if (certificate == null) {
            return VerifyResultVO.fail("证照不存在");
        }

        boolean faceMatch = ocrService.compareFace(dto.getFaceImageBase64(), dto.getFaceImageBase64());
        if (!faceMatch) {
            return VerifyResultVO.fail("人脸比对不通过");
        }

        return verifyCertificate(certificate, dto.getCertificateNo(), dto);
    }

    private VerifyResultVO verifyCertificate(Certificate certificate, String certificateNo, CertificateVerifyDTO dto) {
        if (certificate == null || certificate.getDeleted()) {
            return VerifyResultVO.fail("证照不存在");
        }

        if (CertificateStatusEnum.EXPIRED.getCode().equals(certificate.getStatus())) {
            return VerifyResultVO.fail(ResultCode.CERTIFICATE_EXPIRED.getMessage());
        }

        if (CertificateStatusEnum.REVOKED.getCode().equals(certificate.getStatus())) {
            return VerifyResultVO.fail(ResultCode.CERTIFICATE_REVOKED.getMessage());
        }

        if (!CertificateStatusEnum.VALID.getCode().equals(certificate.getStatus())) {
            return VerifyResultVO.fail("证照状态无效");
        }

        VerifyResultVO result = VerifyResultVO.success("核验通过");

        boolean blockchainVerify = blockchainService.verifyCertificate(
                certificateNo, certificate.getDataHash(), certificate.getBlockchainTxHash());
        result.setBlockchainVerifyResult(blockchainVerify ? "通过" : "不通过");

        if (StrUtil.isNotBlank(certificate.getIpfsHash())) {
            try {
                Map<String, Object> ipfsData = ipfsService.downloadJson(certificate.getIpfsHash());
                result.setCertificateInfo(ipfsData);
            } catch (Exception e) {
                log.warn("从IPFS获取证照数据失败", e);
            }
        }

        Map<String, Object> verifyDetail = new HashMap<>();
        verifyDetail.put("certificateId", certificate.getId());
        verifyDetail.put("certificateNo", certificate.getCertificateNo());
        verifyDetail.put("certificateName", certificate.getCertificateName());
        verifyDetail.put("userName", certificate.getUserName());
        verifyDetail.put("issuingAuthority", certificate.getIssuingAuthority());
        verifyDetail.put("issueDate", certificate.getIssueDate());
        verifyDetail.put("expireDate", certificate.getExpireDate());
        verifyDetail.put("dataHash", certificate.getDataHash());
        verifyDetail.put("ipfsHash", certificate.getIpfsHash());
        verifyDetail.put("blockchainTxHash", certificate.getBlockchainTxHash());
        result.setVerifyDetail(verifyDetail);

        return result;
    }

    private String extractTokenFromQrcode(String qrcodeContent) {
        if (qrcodeContent.startsWith("certificate://verify?token=")) {
            int start = qrcodeContent.indexOf("token=") + 6;
            int end = qrcodeContent.indexOf("&", start);
            if (end > 0) {
                return qrcodeContent.substring(start, end);
            }
            return qrcodeContent.substring(start);
        }
        return qrcodeContent;
    }

    private void saveVerifyLog(CertificateVerifyDTO dto, VerifyResultVO result) {
        try {
            LambdaQueryWrapper<Certificate> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Certificate::getCertificateNo, dto.getCertificateNo())
                    .eq(Certificate::getDeleted, false);
            Certificate certificate = certificateMapper.selectOne(wrapper);

            CertificateVerifyLog verifyLog = new CertificateVerifyLog();
            if (certificate != null) {
                verifyLog.setCertificateId(certificate.getId());
                verifyLog.setCertificateNo(certificate.getCertificateNo());
            }
            verifyLog.setVerifyType(dto.getVerifyType());
            verifyLog.setVerifyContent(dto.getVerifyPurpose());
            verifyLog.setVerifierId(dto.getVerifierId());
            verifyLog.setVerifierName(dto.getVerifierName());
            verifyLog.setVerifierOrg(dto.getVerifierOrg());
            verifyLog.setVerifyTime(LocalDateTime.now());
            verifyLog.setVerifyResult(result.getSuccess());
            verifyLog.setVerifyDetail(JSON.toJSONString(result.getVerifyDetail()));
            verifyLog.setIpAddress(getClientIp());
            verifyLog.setUserAgent(request.getHeader("User-Agent"));

            verifyLogMapper.insert(verifyLog);
            result.setVerifyLogId(verifyLog.getId().toString());
        } catch (Exception e) {
            log.error("保存核验日志失败", e);
        }
    }

    private void sendVerifyMessage(CertificateVerifyDTO dto, VerifyResultVO result) {
        try {
            rocketMQTemplate.convertAndSend("certificate-verify-topic", Map.of(
                    "certificateNo", dto.getCertificateNo(),
                    "verifyType", dto.getVerifyType(),
                    "verifyResult", result.getSuccess(),
                    "verifierId", dto.getVerifierId(),
                    "verifierName", dto.getVerifierName(),
                    "verifierOrg", dto.getVerifierOrg(),
                    "verifyTime", LocalDateTime.now(),
                    "ipAddress", getClientIp()
            ));
        } catch (Exception e) {
            log.error("发送核验消息失败", e);
        }
    }

    private String getClientIp() {
        String ip = request.getHeader("X-Forwarded-For");
        if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (StrUtil.isBlank(ip) || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
