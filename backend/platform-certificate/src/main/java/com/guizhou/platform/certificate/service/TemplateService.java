package com.guizhou.platform.certificate.service;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.certificate.dto.request.TemplateCreateDTO;
import com.guizhou.platform.certificate.entity.CertificateTemplate;
import com.guizhou.platform.certificate.enums.CertificateStatusEnum;
import com.guizhou.platform.certificate.mapper.CertificateTemplateMapper;
import com.guizhou.platform.common.base.PageQuery;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TemplateService {

    private final CertificateTemplateMapper templateMapper;

    @Transactional(rollbackFor = Exception.class)
    public CertificateTemplate createTemplate(TemplateCreateDTO dto) {
        LambdaQueryWrapper<CertificateTemplate> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CertificateTemplate::getTemplateCode, dto.getTemplateCode())
                .eq(CertificateTemplate::getDeleted, false);
        Long count = templateMapper.selectCount(wrapper);
        if (count > 0) {
            throw new BusinessException(ResultCode.DATA_ALREADY_EXIST, "模板编码已存在");
        }

        CertificateTemplate template = new CertificateTemplate();
        BeanUtils.copyProperties(dto, template);

        if (dto.getStyleConfig() != null) {
            template.setStyleConfig(JSON.toJSONString(dto.getStyleConfig()));
        }
        if (dto.getFieldConfig() != null) {
            template.setFieldConfig(JSON.toJSONString(dto.getFieldConfig()));
        }
        if (dto.getSignConfig() != null) {
            template.setSignConfig(JSON.toJSONString(dto.getSignConfig()));
        }
        if (dto.getSealConfig() != null) {
            template.setSealConfig(JSON.toJSONString(dto.getSealConfig()));
        }

        template.setStatus(1);
        templateMapper.insert(template);

        log.info("证照模板创建成功，模板ID: {}, 模板编码: {}", template.getId(), template.getTemplateCode());
        return template;
    }

    public CertificateTemplate getTemplate(Long id) {
        CertificateTemplate template = templateMapper.selectById(id);
        if (template == null || template.getDeleted()) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "模板不存在");
        }
        return template;
    }

    public CertificateTemplate getTemplateByCode(String templateCode) {
        LambdaQueryWrapper<CertificateTemplate> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CertificateTemplate::getTemplateCode, templateCode)
                .eq(CertificateTemplate::getDeleted, false)
                .eq(CertificateTemplate::getStatus, 1);
        CertificateTemplate template = templateMapper.selectOne(wrapper);
        if (template == null) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "模板不存在");
        }
        return template;
    }

    public PageResult<CertificateTemplate> getTemplateList(Integer certificateType, Integer status, PageQuery pageQuery) {
        LambdaQueryWrapper<CertificateTemplate> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CertificateTemplate::getDeleted, false);
        if (certificateType != null) {
            wrapper.eq(CertificateTemplate::getCertificateType, certificateType);
        }
        if (status != null) {
            wrapper.eq(CertificateTemplate::getStatus, status);
        }
        wrapper.orderByDesc(CertificateTemplate::getCreateTime);

        Page<CertificateTemplate> page = new Page<>(pageQuery.getPageNum(), pageQuery.getPageSize());
        IPage<CertificateTemplate> resultPage = templateMapper.selectPage(page, wrapper);

        return PageResult.of(
                resultPage.getTotal(),
                resultPage.getRecords(),
                pageQuery.getPageNum(),
                pageQuery.getPageSize()
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public CertificateTemplate updateTemplate(Long id, TemplateCreateDTO dto) {
        CertificateTemplate template = templateMapper.selectById(id);
        if (template == null || template.getDeleted()) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "模板不存在");
        }

        BeanUtils.copyProperties(dto, template, "id", "templateCode");

        if (dto.getStyleConfig() != null) {
            template.setStyleConfig(JSON.toJSONString(dto.getStyleConfig()));
        }
        if (dto.getFieldConfig() != null) {
            template.setFieldConfig(JSON.toJSONString(dto.getFieldConfig()));
        }
        if (dto.getSignConfig() != null) {
            template.setSignConfig(JSON.toJSONString(dto.getSignConfig()));
        }
        if (dto.getSealConfig() != null) {
            template.setSealConfig(JSON.toJSONString(dto.getSealConfig()));
        }

        if (dto.getVersion() != null) {
            template.setVersion(dto.getVersion());
        }

        templateMapper.updateById(template);
        log.info("证照模板更新成功，模板ID: {}", id);
        return template;
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteTemplate(Long id) {
        CertificateTemplate template = templateMapper.selectById(id);
        if (template == null || template.getDeleted()) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "模板不存在");
        }
        templateMapper.deleteById(id);
        log.info("证照模板删除成功，模板ID: {}", id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void enableTemplate(Long id) {
        CertificateTemplate template = templateMapper.selectById(id);
        if (template == null || template.getDeleted()) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "模板不存在");
        }
        template.setStatus(1);
        templateMapper.updateById(template);
        log.info("证照模板启用成功，模板ID: {}", id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void disableTemplate(Long id) {
        CertificateTemplate template = templateMapper.selectById(id);
        if (template == null || template.getDeleted()) {
            throw new BusinessException(ResultCode.DATA_NOT_EXIST, "模板不存在");
        }
        template.setStatus(0);
        templateMapper.updateById(template);
        log.info("证照模板禁用成功，模板ID: {}", id);
    }
}
