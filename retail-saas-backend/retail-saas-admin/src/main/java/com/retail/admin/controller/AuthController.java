package com.retail.admin.controller;

import com.retail.admin.dto.LoginDTO;
import com.retail.admin.service.AuthService;
import com.retail.admin.vo.LoginVO;
import com.retail.admin.vo.MenuVO;
import com.retail.admin.vo.UserInfoVO;
import com.retail.common.result.Result;
import com.retail.domain.entity.SysOrg;
import com.retail.domain.entity.SysRole;
import com.retail.domain.entity.SysUser;
import com.retail.mapper.SysMenuMapper;
import com.retail.mapper.SysOrgMapper;
import com.retail.mapper.SysRoleMapper;
import com.retail.mapper.SysUserMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.stream.Collectors;

@Api(tags = "认证接口")
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Resource
    private AuthService authService;

    @Resource
    private SysUserMapper sysUserMapper;

    @Resource
    private SysOrgMapper sysOrgMapper;

    @Resource
    private SysRoleMapper sysRoleMapper;

    @Resource
    private SysMenuMapper sysMenuMapper;

    @ApiOperation("用户登录")
    @PostMapping("/login")
    public Result<LoginVO> login(@Validated @RequestBody LoginDTO loginDTO) {
        LoginVO vo = authService.login(loginDTO);
        return Result.success(vo);
    }

    @ApiOperation("用户登出")
    @PostMapping("/logout")
    public Result<Void> logout() {
        authService.logout();
        return Result.success();
    }

    @ApiOperation("获取用户信息")
    @GetMapping("/info")
    public Result<UserInfoVO> getUserInfo(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            Object userIdObj = request.getAttribute("userId");
            if (userIdObj instanceof String) {
                userId = Long.parseLong((String) userIdObj);
            }
        }
        
        SysUser user = sysUserMapper.selectById(userId);
        if (user == null) {
            return Result.error("用户不存在");
        }

        SysOrg org = sysOrgMapper.selectById(user.getOrgId());
        List<SysRole> roles = sysRoleMapper.selectByUserId(userId);
        List<String> roleCodes = roles.stream().map(SysRole::getRoleCode).collect(Collectors.toList());
        List<String> permissions = sysMenuMapper.selectPermissionsByUserId(userId);
        List<MenuVO> menus = authService.getUserMenus(userId);

        UserInfoVO vo = UserInfoVO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .realName(user.getRealName())
                .avatar("")
                .orgId(user.getOrgId())
                .orgName(org != null ? org.getOrgName() : "")
                .orgPath(org != null ? org.getPath() : "")
                .dataScope(user.getDataScope())
                .roles(roleCodes)
                .permissions(permissions)
                .menus(menus)
                .build();

        return Result.success(vo);
    }

    @ApiOperation("获取用户菜单")
    @GetMapping("/menus")
    public Result<List<MenuVO>> getMenus(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<MenuVO> menus = authService.getUserMenus(userId);
        return Result.success(menus);
    }

    @ApiOperation("获取用户权限")
    @GetMapping("/permissions")
    public Result<List<String>> getPermissions(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<String> permissions = authService.getUserPermissions(userId);
        return Result.success(permissions);
    }
}
