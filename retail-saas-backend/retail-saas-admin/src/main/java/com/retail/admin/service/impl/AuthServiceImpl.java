package com.retail.admin.service.impl;

import cn.hutool.crypto.digest.BCrypt;
import com.retail.admin.dto.LoginDTO;
import com.retail.admin.service.AuthService;
import com.retail.admin.vo.LoginVO;
import com.retail.admin.vo.MenuVO;
import com.retail.common.exception.BusinessException;
import com.retail.common.result.ResultCode;
import com.retail.common.utils.JwtUtils;
import com.retail.domain.entity.SysMenu;
import com.retail.domain.entity.SysOrg;
import com.retail.domain.entity.SysRole;
import com.retail.domain.entity.SysUser;
import com.retail.mapper.SysMenuMapper;
import com.retail.mapper.SysOrgMapper;
import com.retail.mapper.SysRoleMapper;
import com.retail.mapper.SysUserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AuthServiceImpl implements AuthService {

    @Resource
    private SysUserMapper sysUserMapper;

    @Resource
    private SysRoleMapper sysRoleMapper;

    @Resource
    private SysMenuMapper sysMenuMapper;

    @Resource
    private SysOrgMapper sysOrgMapper;

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    private static final String DEFAULT_PASSWORD = "123456";

    @Override
    public LoginVO login(LoginDTO loginDTO) {
        SysUser user = sysUserMapper.selectByUsername(loginDTO.getUsername());
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }

        if (user.getStatus() != 1) {
            throw new BusinessException(ResultCode.USER_DISABLED);
        }

        boolean passwordValid;
        if (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$")) {
            passwordValid = BCrypt.checkpw(loginDTO.getPassword(), user.getPassword());
        } else {
            passwordValid = loginDTO.getPassword().equals(user.getPassword());
        }

        if (!passwordValid) {
            throw new BusinessException(ResultCode.PASSWORD_ERROR);
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("orgId", user.getOrgId());
        claims.put("username", user.getUsername());
        claims.put("dataScope", user.getDataScope());
        String token = JwtUtils.createToken(claims);

        List<SysRole> roles = sysRoleMapper.selectByUserId(user.getId());
        List<String> roleCodes = roles.stream().map(SysRole::getRoleCode).collect(Collectors.toList());

        List<String> permissions = sysMenuMapper.selectPermissionsByUserId(user.getId());

        SysOrg org = sysOrgMapper.selectById(user.getOrgId());
        String orgName = org != null ? org.getOrgName() : "";

        List<MenuVO> menus = getUserMenus(user.getId());

        String tokenKey = "token:" + user.getId();
        redisTemplate.opsForValue().set(tokenKey, token, 1, TimeUnit.DAYS);

        return LoginVO.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .orgId(user.getOrgId())
                .orgName(orgName)
                .dataScope(user.getDataScope())
                .roles(roleCodes)
                .permissions(permissions)
                .menus(menus)
                .build();
    }

    @Override
    public void logout() {
    }

    @Override
    public List<MenuVO> getUserMenus(Long userId) {
        List<SysMenu> menus = sysMenuMapper.selectByUserId(userId);
        return buildMenuTree(menus, 0L);
    }

    @Override
    public List<String> getUserPermissions(Long userId) {
        return sysMenuMapper.selectPermissionsByUserId(userId);
    }

    private List<MenuVO> buildMenuTree(List<SysMenu> menus, Long parentId) {
        return menus.stream()
                .filter(m -> m.getParentId().equals(parentId))
                .map(m -> {
                    MenuVO vo = MenuVO.builder()
                            .id(m.getId())
                            .parentId(m.getParentId())
                            .menuName(m.getMenuName())
                            .menuType(m.getMenuType())
                            .path(m.getPath())
                            .component(m.getComponent())
                            .permission(m.getPermission())
                            .icon(m.getIcon())
                            .redirect(m.getRedirect())
                            .sort(m.getSort())
                            .visible(m.getVisible() != null && m.getVisible() == 1)
                            .build();
                    List<MenuVO> children = buildMenuTree(menus, m.getId());
                    if (!children.isEmpty()) {
                        vo.setChildren(children);
                    }
                    return vo;
                })
                .sorted(Comparator.comparing(MenuVO::getSort, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }
}
