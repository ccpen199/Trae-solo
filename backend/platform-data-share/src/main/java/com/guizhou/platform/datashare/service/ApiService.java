package com.guizhou.platform.datashare.service;

import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.datashare.dto.ApiQueryDTO;
import com.guizhou.platform.datashare.dto.ApiRegisterDTO;
import com.guizhou.platform.datashare.entity.ApiInfo;
import com.guizhou.platform.datashare.enums.ApiStatusEnum;
import com.guizhou.platform.datashare.mapper.ApiInfoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ApiService {

    private final ApiInfoMapper apiInfoMapper;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String API_CACHE_PREFIX = "data-share:api:";

    @Transactional(rollbackFor = Exception.class)
    public Long registerApi(ApiRegisterDTO dto) {
        LambdaQueryWrapper<ApiInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ApiInfo::getApiCode, dto.getApiCode())
                .eq(ApiInfo::getApiVersion, dto.getApiVersion())
                .eq(ApiInfo::getDeleted, false);
        Long count = apiInfoMapper.selectCount(wrapper);
        if (count > 0) {
            throw new BusinessException("API编码" + dto.getApiCode() + "版本" + dto.getApiVersion() + "已存在");
        }

        ApiInfo apiInfo = new ApiInfo();
        BeanUtils.copyProperties(dto, apiInfo);
        apiInfo.setStatus(ApiStatusEnum.DRAFT.getCode());
        apiInfo.setNeedAuth(dto.getNeedAuth() != null && dto.getNeedAuth());
        apiInfo.setNeedDesensitize(dto.getNeedDesensitize() != null && dto.getNeedDesensitize());
        apiInfoMapper.insert(apiInfo);

        return apiInfo.getId();
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateApi(ApiRegisterDTO dto) {
        if (dto.getId() == null) {
            throw new BusinessException("API ID不能为空");
        }
        ApiInfo apiInfo = apiInfoMapper.selectById(dto.getId());
        if (apiInfo == null) {
            throw new BusinessException("API不存在");
        }
        if (ApiStatusEnum.PUBLISHED.getCode().equals(apiInfo.getStatus())) {
            throw new BusinessException("已发布的API不能修改，请先下线");
        }

        BeanUtils.copyProperties(dto, apiInfo, "id", "apiCode", "apiVersion", "createTime");
        apiInfoMapper.updateById(apiInfo);

        deleteCache(apiInfo.getApiCode(), apiInfo.getApiVersion());
    }

    @Transactional(rollbackFor = Exception.class)
    public void publishApi(Long id) {
        ApiInfo apiInfo = apiInfoMapper.selectById(id);
        if (apiInfo == null) {
            throw new BusinessException("API不存在");
        }
        if (!ApiStatusEnum.DRAFT.getCode().equals(apiInfo.getStatus())
                && !ApiStatusEnum.OFFLINE.getCode().equals(apiInfo.getStatus())) {
            throw new BusinessException("只有草稿或已下线状态的API才能发布");
        }

        apiInfo.setStatus(ApiStatusEnum.PUBLISHED.getCode());
        apiInfo.setPublishTime(LocalDateTime.now());
        apiInfoMapper.updateById(apiInfo);

        cacheApiInfo(apiInfo);
    }

    @Transactional(rollbackFor = Exception.class)
    public void offlineApi(Long id) {
        ApiInfo apiInfo = apiInfoMapper.selectById(id);
        if (apiInfo == null) {
            throw new BusinessException("API不存在");
        }
        if (!ApiStatusEnum.PUBLISHED.getCode().equals(apiInfo.getStatus())) {
            throw new BusinessException("只有已发布状态的API才能下线");
        }

        apiInfo.setStatus(ApiStatusEnum.OFFLINE.getCode());
        apiInfo.setOfflineTime(LocalDateTime.now());
        apiInfoMapper.updateById(apiInfo);

        deleteCache(apiInfo.getApiCode(), apiInfo.getApiVersion());
    }

    public ApiInfo getApiById(Long id) {
        return apiInfoMapper.selectById(id);
    }

    public ApiInfo getApiByCode(String apiCode, String apiVersion) {
        String cacheKey = API_CACHE_PREFIX + apiCode + ":" + apiVersion;
        String cached = stringRedisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return JSON.parseObject(cached, ApiInfo.class);
        }

        LambdaQueryWrapper<ApiInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ApiInfo::getApiCode, apiCode)
                .eq(ApiInfo::getApiVersion, apiVersion)
                .eq(ApiInfo::getStatus, ApiStatusEnum.PUBLISHED.getCode())
                .eq(ApiInfo::getDeleted, false);
        ApiInfo apiInfo = apiInfoMapper.selectOne(wrapper);

        if (apiInfo != null) {
            cacheApiInfo(apiInfo);
        }

        return apiInfo;
    }

    public PageResult<ApiInfo> queryApiList(ApiQueryDTO dto) {
        LambdaQueryWrapper<ApiInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(dto.getApiCode() != null, ApiInfo::getApiCode, dto.getApiCode())
                .like(dto.getApiName() != null, ApiInfo::getApiName, dto.getApiName())
                .eq(dto.getApiVersion() != null, ApiInfo::getApiVersion, dto.getApiVersion())
                .eq(dto.getDeptCode() != null, ApiInfo::getDeptCode, dto.getDeptCode())
                .eq(dto.getDatasourceCode() != null, ApiInfo::getDatasourceCode, dto.getDatasourceCode())
                .eq(dto.getStatus() != null, ApiInfo::getStatus, dto.getStatus())
                .ge(dto.getStartTime() != null, ApiInfo::getCreateTime, dto.getStartTime())
                .le(dto.getEndTime() != null, ApiInfo::getCreateTime, dto.getEndTime())
                .eq(ApiInfo::getDeleted, false)
                .orderByDesc(ApiInfo::getCreateTime);

        Page<ApiInfo> page = new Page<>(dto.getPageNum(), dto.getPageSize());
        apiInfoMapper.selectPage(page, wrapper);

        return PageResult.of(page.getRecords(), page.getTotal(), dto.getPageNum(), dto.getPageSize());
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteApi(Long id) {
        ApiInfo apiInfo = apiInfoMapper.selectById(id);
        if (apiInfo == null) {
            throw new BusinessException("API不存在");
        }
        if (ApiStatusEnum.PUBLISHED.getCode().equals(apiInfo.getStatus())) {
            throw new BusinessException("已发布的API不能删除，请先下线");
        }
        apiInfoMapper.deleteById(id);
        deleteCache(apiInfo.getApiCode(), apiInfo.getApiVersion());
    }

    private void cacheApiInfo(ApiInfo apiInfo) {
        String cacheKey = API_CACHE_PREFIX + apiInfo.getApiCode() + ":" + apiInfo.getApiVersion();
        stringRedisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(apiInfo), 24, TimeUnit.HOURS);
    }

    private void deleteCache(String apiCode, String apiVersion) {
        String cacheKey = API_CACHE_PREFIX + apiCode + ":" + apiVersion;
        stringRedisTemplate.delete(cacheKey);
    }
}
