package com.guizhou.platform.subsidyverify.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.common.result.ResultCode;
import com.guizhou.platform.subsidyverify.dto.request.MerchantApplyDTO;
import com.guizhou.platform.subsidyverify.dto.response.MerchantDetailVO;
import com.guizhou.platform.subsidyverify.entity.Merchant;
import com.guizhou.platform.subsidyverify.entity.MerchantCategory;
import com.guizhou.platform.subsidyverify.enums.MerchantCategoryEnum;
import com.guizhou.platform.subsidyverify.enums.MerchantStatusEnum;
import com.guizhou.platform.subsidyverify.mapper.MerchantCategoryMapper;
import com.guizhou.platform.subsidyverify.mapper.MerchantMapper;
import com.guizhou.platform.subsidyverify.service.MerchantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MerchantServiceImpl extends ServiceImpl<MerchantMapper, Merchant> implements MerchantService {

    private final MerchantCategoryMapper categoryMapper;

    private static final DateTimeFormatter MERCHANT_CODE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Override
    public String apply(MerchantApplyDTO dto) {
        long exists = count(new LambdaQueryWrapper<Merchant>()
                .eq(Merchant::getBusinessLicenseNo, dto.getBusinessLicenseNo())
                .ne(Merchant::getStatus, MerchantStatusEnum.BLACKLISTED.getCode()));
        if (exists > 0) {
            throw new BusinessException(ResultCode.DATA_ALREADY_EXIST, "该营业执照号已申请入驻");
        }

        MerchantCategory category = categoryMapper.getByCode(dto.getCategoryCode());
        if (category == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "商户分类不存在");
        }

        Merchant merchant = new Merchant();
        BeanUtils.copyProperties(dto, merchant);
        merchant.setMerchantCode(generateMerchantCode());
        merchant.setCategoryName(category.getCategoryName());
        merchant.setStatus(MerchantStatusEnum.PENDING_REVIEW.getCode());
        merchant.setVerifyCount(0);
        save(merchant);

        log.info("商户入驻申请成功, merchantCode={}, name={}", merchant.getMerchantCode(), merchant.getMerchantName());
        return merchant.getMerchantCode();
    }

    @Override
    public MerchantDetailVO getDetail(Long id) {
        Merchant merchant = getById(id);
        if (merchant == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "商户不存在");
        }
        return convertToVO(merchant);
    }

    @Override
    public void approve(Long id, String opinion) {
        Merchant merchant = getById(id);
        if (merchant == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "商户不存在");
        }
        if (!MerchantStatusEnum.PENDING_REVIEW.getCode().equals(merchant.getStatus())) {
            throw new BusinessException("仅待审核状态可审批通过");
        }
        merchant.setStatus(MerchantStatusEnum.APPROVED.getCode());
        merchant.setQualifiedTime(LocalDateTime.now());
        updateById(merchant);
        log.info("商户审核通过, merchantCode={}", merchant.getMerchantCode());
    }

    @Override
    public void reject(Long id, String opinion) {
        Merchant merchant = getById(id);
        if (merchant == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "商户不存在");
        }
        if (!MerchantStatusEnum.PENDING_REVIEW.getCode().equals(merchant.getStatus())) {
            throw new BusinessException("仅待审核状态可驳回");
        }
        merchant.setStatus(MerchantStatusEnum.REJECTED.getCode());
        merchant.setRemark(opinion);
        updateById(merchant);
        log.info("商户审核驳回, merchantCode={}", merchant.getMerchantCode());
    }

    @Override
    public void disable(Long id, String reason) {
        Merchant merchant = getById(id);
        if (merchant == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "商户不存在");
        }
        merchant.setStatus(MerchantStatusEnum.DISABLED.getCode());
        merchant.setRemark(reason);
        updateById(merchant);
        log.info("商户已禁用, merchantCode={}", merchant.getMerchantCode());
    }

    @Override
    public void enable(Long id) {
        Merchant merchant = getById(id);
        if (merchant == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "商户不存在");
        }
        if (!MerchantStatusEnum.DISABLED.getCode().equals(merchant.getStatus())) {
            throw new BusinessException("仅禁用状态可恢复");
        }
        merchant.setStatus(MerchantStatusEnum.APPROVED.getCode());
        updateById(merchant);
        log.info("商户已恢复, merchantCode={}", merchant.getMerchantCode());
    }

    @Override
    public void blacklist(Long id, String reason) {
        Merchant merchant = getById(id);
        if (merchant == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "商户不存在");
        }
        merchant.setStatus(MerchantStatusEnum.BLACKLISTED.getCode());
        merchant.setRemark(reason);
        updateById(merchant);
        log.info("商户已拉黑, merchantCode={}", merchant.getMerchantCode());
    }

    @Override
    public List<MerchantDetailVO> listByCategory(String categoryCode) {
        List<Merchant> merchants = list(new LambdaQueryWrapper<Merchant>()
                .eq(Merchant::getCategoryCode, categoryCode)
                .orderByDesc(Merchant::getCreateTime));
        return merchants.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    @Override
    public List<MerchantDetailVO> listByStatus(Integer status) {
        List<Merchant> merchants = list(new LambdaQueryWrapper<Merchant>()
                .eq(Merchant::getStatus, status)
                .orderByDesc(Merchant::getCreateTime));
        return merchants.stream().map(this::convertToVO).collect(Collectors.toList());
    }

    private String generateMerchantCode() {
        return "MC" + LocalDateTime.now().format(MERCHANT_CODE_FORMATTER) + IdUtil.simpleUUID().substring(0, 4).toUpperCase();
    }

    private MerchantDetailVO convertToVO(Merchant merchant) {
        MerchantDetailVO vo = new MerchantDetailVO();
        BeanUtils.copyProperties(merchant, vo);
        MerchantStatusEnum statusEnum = MerchantStatusEnum.getByCode(merchant.getStatus());
        if (statusEnum != null) {
            vo.setStatusDesc(statusEnum.getDesc());
        }
        return vo;
    }
}
