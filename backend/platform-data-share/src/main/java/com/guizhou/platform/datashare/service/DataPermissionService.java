package com.guizhou.platform.datashare.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.datashare.dto.DataPermissionDTO;
import com.guizhou.platform.datashare.entity.DataPermission;
import com.guizhou.platform.datashare.mapper.DataPermissionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataPermissionService {

    private final DataPermissionMapper dataPermissionMapper;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String PERMISSION_CACHE_PREFIX = "data-share:permission:";

    @Transactional(rollbackFor = Exception.class)
    public Long savePermission(DataPermissionDTO dto) {
        DataPermission permission = new DataPermission();
        BeanUtils.copyProperties(dto, permission);

        if (dto.getId() == null) {
            dataPermissionMapper.insert(permission);
        } else {
            dataPermissionMapper.updateById(permission);
        }

        clearCache(dto.getApiCode(), dto.getUserId(), dto.getRoleCode(), dto.getDeptCode());
        return permission.getId();
    }

    public DataPermission getPermission(Long id) {
        return dataPermissionMapper.selectById(id);
    }

    public List<DataPermission> getPermissionsByApiId(Long apiId) {
        return dataPermissionMapper.selectByApiId(apiId);
    }

    public boolean checkPermission(String apiCode, String userId, String roleCode, String deptCode, String operation) {
        List<DataPermission> permissions = getMatchedPermissions(apiCode, userId, roleCode, deptCode);
        if (permissions.isEmpty()) {
            return false;
        }

        for (DataPermission permission : permissions) {
            if ("query".equals(operation) && Boolean.TRUE.equals(permission.getCanQuery())) {
                return true;
            }
            if ("export".equals(operation) && Boolean.TRUE.equals(permission.getCanExport())) {
                return true;
            }
        }
        return false;
    }

    public Object applyDataScope(Object data, String apiCode, String userId, String roleCode, String deptCode) {
        List<DataPermission> permissions = getMatchedPermissions(apiCode, userId, roleCode, deptCode);
        if (permissions.isEmpty()) {
            return new JSONObject();
        }

        DataPermission highestPermission = permissions.get(0);
        String jsonString = JSON.toJSONString(data);
        Object parseResult = JSON.parse(jsonString);

        if (parseResult instanceof JSONObject) {
            applyFieldFilter((JSONObject) parseResult, highestPermission);
            applyRowLimit((JSONObject) parseResult, highestPermission);
        } else if (parseResult instanceof JSONArray) {
            applyRowLimit((JSONArray) parseResult, highestPermission);
            for (int i = 0; i < ((JSONArray) parseResult).size(); i++) {
                Object item = ((JSONArray) parseResult).get(i);
                if (item instanceof JSONObject) {
                    applyFieldFilter((JSONObject) item, highestPermission);
                }
            }
        }

        return parseResult;
    }

    @Transactional(rollbackFor = Exception.class)
    public void deletePermission(Long id) {
        DataPermission permission = dataPermissionMapper.selectById(id);
        if (permission == null) {
            throw new BusinessException("权限配置不存在");
        }
        dataPermissionMapper.deleteById(id);
        clearCache(permission.getApiCode(), permission.getUserId(), permission.getRoleCode(), permission.getDeptCode());
    }

    public List<DataPermission> queryPermissions(Long apiId, String roleCode, String deptCode) {
        LambdaQueryWrapper<DataPermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(apiId != null, DataPermission::getApiId, apiId)
                .eq(roleCode != null, DataPermission::getRoleCode, roleCode)
                .eq(deptCode != null, DataPermission::getDeptCode, deptCode)
                .eq(DataPermission::getDeleted, false)
                .orderByDesc(DataPermission::getPriority, DataPermission::getCreateTime);
        return dataPermissionMapper.selectList(wrapper);
    }

    private List<DataPermission> getMatchedPermissions(String apiCode, String userId, String roleCode, String deptCode) {
        String cacheKey = PERMISSION_CACHE_PREFIX + apiCode + ":" + userId + ":" + roleCode + ":" + deptCode;
        String cached = stringRedisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return JSON.parseArray(cached, DataPermission.class);
        }

        List<DataPermission> permissions = dataPermissionMapper.selectByApiCodeAndUser(apiCode, userId, roleCode, deptCode);

        stringRedisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(permissions), 1, TimeUnit.HOURS);

        return permissions;
    }

    private void applyFieldFilter(JSONObject jsonObject, DataPermission permission) {
        if (permission.getFieldPermissions() == null) {
            return;
        }

        try {
            JSONObject fieldPerms = JSON.parseObject(permission.getFieldPermissions());
            Set<String> allowedFields = fieldPerms.keySet().stream()
                    .filter(field -> Boolean.TRUE.equals(fieldPerms.getBoolean(field)))
                    .collect(Collectors.toSet());

            if (!allowedFields.isEmpty()) {
                List<String> keysToRemove = jsonObject.keySet().stream()
                        .filter(key -> !allowedFields.contains(key))
                        .collect(Collectors.toList());
                keysToRemove.forEach(jsonObject::remove);
            }
        } catch (Exception e) {
            log.warn("字段权限解析失败: {}", e.getMessage());
        }
    }

    private void applyRowLimit(JSONObject jsonObject, DataPermission permission) {
        if (permission.getRowLimit() == null || permission.getRowLimit() <= 0) {
            return;
        }

        for (Map.Entry<String, Object> entry : jsonObject.entrySet()) {
            if (entry.getValue() instanceof JSONArray) {
                applyRowLimit((JSONArray) entry.getValue(), permission);
            }
        }
    }

    private void applyRowLimit(JSONArray jsonArray, DataPermission permission) {
        if (permission.getRowLimit() == null || permission.getRowLimit() <= 0) {
            return;
        }
        if (jsonArray.size() > permission.getRowLimit()) {
            JSONArray limited = new JSONArray();
            for (int i = 0; i < permission.getRowLimit(); i++) {
                limited.add(jsonArray.get(i));
            }
            jsonArray.clear();
            jsonArray.addAll(limited);
        }
    }

    private void clearCache(String apiCode, String userId, String roleCode, String deptCode) {
        List<String> keys = Arrays.asList(
                PERMISSION_CACHE_PREFIX + apiCode + ":" + userId + ":" + roleCode + ":" + deptCode,
                PERMISSION_CACHE_PREFIX + apiCode + ":*:" + roleCode + ":" + deptCode,
                PERMISSION_CACHE_PREFIX + apiCode + ":" + userId + ":*:" + deptCode,
                PERMISSION_CACHE_PREFIX + apiCode + ":" + userId + ":" + roleCode + ":*"
        );
        keys.forEach(stringRedisTemplate::delete);
    }
}
