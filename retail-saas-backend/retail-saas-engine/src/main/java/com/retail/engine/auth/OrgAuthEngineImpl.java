package com.retail.engine.auth;

import com.retail.domain.entity.SysOrg;
import com.retail.domain.entity.SysUser;
import com.retail.mapper.SysMenuMapper;
import com.retail.mapper.SysOrgMapper;
import com.retail.mapper.SysUserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class OrgAuthEngineImpl implements OrgAuthEngine {

    @Resource
    private SysUserMapper sysUserMapper;

    @Resource
    private SysOrgMapper sysOrgMapper;

    @Resource
    private SysMenuMapper sysMenuMapper;

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    private static final String DATA_SCOPE_KEY = "data_scope:";
    private static final String PERMISSION_KEY = "permissions:";

    @Override
    public boolean checkDataPermission(Long userId, Long targetOrgId) {
        String dataScope = getUserDataScope(userId);
        if (dataScope == null) {
            return false;
        }

        switch (dataScope) {
            case "ALL":
                return true;
            case "SELF":
                SysUser user = sysUserMapper.selectById(userId);
                return user != null && user.getOrgId().equals(targetOrgId);
            case "THIS_LEVEL":
                SysUser thisUser = sysUserMapper.selectById(userId);
                return thisUser != null && thisUser.getOrgId().equals(targetOrgId);
            case "THIS_LEVEL_CHILDREN":
                SysUser parentUser = sysUserMapper.selectById(userId);
                if (parentUser == null) {
                    return false;
                }
                SysOrg parentOrg = sysOrgMapper.selectById(parentUser.getOrgId());
                if (parentOrg == null) {
                    return false;
                }
                List<SysOrg> children = sysOrgMapper.selectByPathLike(parentOrg.getPath());
                return children.stream().anyMatch(o -> o.getId().equals(targetOrgId));
            case "CUSTOM":
                Long[] accessibleOrgs = getUserAccessibleOrgIds(userId);
                return Arrays.asList(accessibleOrgs).contains(targetOrgId);
            default:
                return false;
        }
    }

    @Override
    public boolean checkFunctionPermission(Long userId, String permission) {
        if (permission == null || permission.isEmpty()) {
            return true;
        }
        List<String> permissions = getUserPermissions(userId);
        return permissions.contains(permission);
    }

    @Override
    public String getUserDataScope(Long userId) {
        String cacheKey = DATA_SCOPE_KEY + userId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (String) cached;
        }

        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            return null;
        }

        String dataScope = user.getDataScope();
        if (dataScope != null) {
            redisTemplate.opsForValue().set(cacheKey, dataScope, 1, TimeUnit.HOURS);
        }
        return dataScope;
    }

    @Override
    public Long[] getUserAccessibleOrgIds(Long userId) {
        return new Long[0];
    }

    @Override
    public void refreshUserPermissions(Long userId) {
        redisTemplate.delete(DATA_SCOPE_KEY + userId);
        redisTemplate.delete(PERMISSION_KEY + userId);
        log.info("Refreshed permissions for user: {}", userId);
    }

    @SuppressWarnings("unchecked")
    private List<String> getUserPermissions(Long userId) {
        String cacheKey = PERMISSION_KEY + userId;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return (List<String>) cached;
        }

        List<String> permissions = sysMenuMapper.selectPermissionsByUserId(userId);
        if (permissions == null) {
            permissions = new ArrayList<>();
        }

        redisTemplate.opsForValue().set(cacheKey, permissions, 1, TimeUnit.HOURS);
        return permissions;
    }
}
