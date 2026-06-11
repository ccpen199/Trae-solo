package com.guizhou.platform.living.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.living.dto.request.ProviderApplyDTO;
import com.guizhou.platform.living.dto.response.ProviderDetailVO;
import com.guizhou.platform.living.entity.LivingCategory;
import com.guizhou.platform.living.entity.ServiceProvider;
import com.guizhou.platform.living.entity.ServiceProviderStaff;
import com.guizhou.platform.living.enums.LivingCategoryEnum;
import com.guizhou.platform.living.enums.ProviderStatusEnum;
import com.guizhou.platform.living.mapper.ServiceProviderMapper;
import com.guizhou.platform.living.mapper.ServiceProviderStaffMapper;
import com.guizhou.platform.living.mapper.LivingCategoryMapper;
import com.guizhou.platform.living.service.ServiceProviderService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ServiceProviderServiceImpl extends ServiceImpl<ServiceProviderMapper, ServiceProvider> implements ServiceProviderService {

    @Resource
    private ServiceProviderStaffMapper staffMapper;

    @Resource
    private LivingCategoryMapper categoryMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String applyProvider(ProviderApplyDTO dto) {
        LivingCategoryEnum categoryEnum = LivingCategoryEnum.getByCode(dto.getCategoryCode());
        if (categoryEnum == null) {
            throw new BusinessException("无效的服务分类编码");
        }

        long exists = this.count(new LambdaQueryWrapper<ServiceProvider>()
                .eq(ServiceProvider::getBusinessLicense, dto.getBusinessLicense())
                .ne(ServiceProvider::getProviderStatus, ProviderStatusEnum.BLACKLISTED.getCode()));
        if (exists > 0) {
            throw new BusinessException("该营业执照已申请入驻");
        }

        ServiceProvider provider = new ServiceProvider();
        BeanUtils.copyProperties(dto, provider);
        provider.setProviderCode("P" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        provider.setCategoryName(categoryEnum.getDesc());
        provider.setProviderStatus(ProviderStatusEnum.PENDING_REVIEW.getCode());
        provider.setAvgScore(BigDecimal.ZERO);
        provider.setTotalOrders(0);
        provider.setTotalEvaluates(0);
        this.save(provider);

        return provider.getProviderCode();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reviewProvider(Long providerId, Boolean passed, String opinion) {
        ServiceProvider provider = this.getById(providerId);
        if (provider == null) {
            throw new BusinessException("服务商不存在");
        }
        if (!ProviderStatusEnum.PENDING_REVIEW.getCode().equals(provider.getProviderStatus())) {
            throw new BusinessException("当前状态不允许审核");
        }

        if (passed) {
            provider.setProviderStatus(ProviderStatusEnum.REVIEW_PASSED.getCode());
        } else {
            provider.setProviderStatus(ProviderStatusEnum.REVIEW_REJECTED.getCode());
        }
        this.updateById(provider);
    }

    @Override
    public ProviderDetailVO getProviderDetail(Long providerId) {
        ServiceProvider provider = this.getById(providerId);
        if (provider == null) {
            return null;
        }

        ProviderDetailVO vo = new ProviderDetailVO();
        BeanUtils.copyProperties(provider, vo);
        ProviderStatusEnum statusEnum = ProviderStatusEnum.getByCode(provider.getProviderStatus());
        if (statusEnum != null) {
            vo.setProviderStatusDesc(statusEnum.getDesc());
        }

        List<ServiceProviderStaff> staffList = staffMapper.selectList(
                new LambdaQueryWrapper<ServiceProviderStaff>()
                        .eq(ServiceProviderStaff::getProviderId, providerId)
                        .eq(ServiceProviderStaff::getStaffStatus, 1));
        List<ProviderDetailVO.StaffInfo> staffInfoList = staffList.stream().map(staff -> {
            ProviderDetailVO.StaffInfo info = new ProviderDetailVO.StaffInfo();
            BeanUtils.copyProperties(staff, info);
            return info;
        }).collect(Collectors.toList());
        vo.setStaffList(staffInfoList);

        return vo;
    }

    @Override
    public List<ProviderDetailVO> listProvidersByCategory(String categoryCode) {
        List<ServiceProvider> list = this.list(new LambdaQueryWrapper<ServiceProvider>()
                .eq(ServiceProvider::getCategoryCode, categoryCode)
                .eq(ServiceProvider::getProviderStatus, ProviderStatusEnum.ACTIVE.getCode())
                .orderByDesc(ServiceProvider::getAvgScore));
        return list.stream().map(provider -> {
            ProviderDetailVO vo = new ProviderDetailVO();
            BeanUtils.copyProperties(provider, vo);
            ProviderStatusEnum statusEnum = ProviderStatusEnum.getByCode(provider.getProviderStatus());
            if (statusEnum != null) {
                vo.setProviderStatusDesc(statusEnum.getDesc());
            }
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void suspendProvider(Long providerId, String reason) {
        ServiceProvider provider = this.getById(providerId);
        if (provider == null) {
            throw new BusinessException("服务商不存在");
        }
        provider.setProviderStatus(ProviderStatusEnum.SUSPENDED.getCode());
        provider.setRemark(reason);
        this.updateById(provider);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void activateProvider(Long providerId) {
        ServiceProvider provider = this.getById(providerId);
        if (provider == null) {
            throw new BusinessException("服务商不存在");
        }
        if (!ProviderStatusEnum.REVIEW_PASSED.getCode().equals(provider.getProviderStatus())
                && !ProviderStatusEnum.SUSPENDED.getCode().equals(provider.getProviderStatus())) {
            throw new BusinessException("当前状态不允许激活");
        }
        provider.setProviderStatus(ProviderStatusEnum.ACTIVE.getCode());
        this.updateById(provider);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void blacklistProvider(Long providerId, String reason) {
        ServiceProvider provider = this.getById(providerId);
        if (provider == null) {
            throw new BusinessException("服务商不存在");
        }
        provider.setProviderStatus(ProviderStatusEnum.BLACKLISTED.getCode());
        provider.setRemark(reason);
        this.updateById(provider);
    }
}
