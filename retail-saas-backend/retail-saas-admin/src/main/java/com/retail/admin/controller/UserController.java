package com.retail.admin.controller;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.retail.common.result.Result;
import com.retail.domain.entity.SysUser;
import com.retail.mapper.SysUserMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;

@Api(tags = "用户管理接口")
@RestController
@RequestMapping("/user")
public class UserController {

    @Resource
    private SysUserMapper sysUserMapper;

    private static final String DEFAULT_PASSWORD = "123456";

    @ApiOperation("分页查询用户")
    @GetMapping("/page")
    public Result<Page<SysUser>> getUserPage(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String realName,
            @RequestParam(required = false) Long orgId,
            @RequestParam(required = false) Integer status) {
        Page<SysUser> page = new Page<>(current, size);
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getDeleted, 0)
                .like(StringUtils.hasText(username), SysUser::getUsername, username)
                .like(StringUtils.hasText(realName), SysUser::getRealName, realName)
                .eq(orgId != null, SysUser::getOrgId, orgId)
                .eq(status != null, SysUser::getStatus, status)
                .orderByDesc(SysUser::getCreateTime);
        Page<SysUser> result = sysUserMapper.selectPage(page, wrapper);
        result.getRecords().forEach(u -> u.setPassword(null));
        return Result.success(result);
    }

    @ApiOperation("根据ID获取用户")
    @GetMapping("/{id}")
    public Result<SysUser> getUserById(@PathVariable Long id) {
        SysUser user = sysUserMapper.selectById(id);
        if (user != null) {
            user.setPassword(null);
        }
        return Result.success(user);
    }

    @ApiOperation("创建用户")
    @PostMapping
    public Result<SysUser> createUser(@RequestBody SysUser user) {
        String password = StringUtils.hasText(user.getPassword()) ? user.getPassword() : DEFAULT_PASSWORD;
        user.setPassword(BCrypt.hashpw(password));
        if (user.getDataScope() == null) {
            user.setDataScope("THIS_LEVEL");
        }
        if (user.getStatus() == null) {
            user.setStatus(1);
        }
        sysUserMapper.insert(user);
        user.setPassword(null);
        return Result.success(user);
    }

    @ApiOperation("更新用户")
    @PutMapping
    public Result<SysUser> updateUser(@RequestBody SysUser user) {
        if (StringUtils.hasText(user.getPassword())) {
            user.setPassword(BCrypt.hashpw(user.getPassword()));
        } else {
            user.setPassword(null);
        }
        sysUserMapper.updateById(user);
        user.setPassword(null);
        return Result.success(user);
    }

    @ApiOperation("删除用户")
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable Long id) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setDeleted(1);
        sysUserMapper.updateById(user);
        return Result.success();
    }

    @ApiOperation("重置密码")
    @PostMapping("/reset-password/{id}")
    public Result<Void> resetPassword(@PathVariable Long id) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setPassword(BCrypt.hashpw(DEFAULT_PASSWORD));
        sysUserMapper.updateById(user);
        return Result.success();
    }

    @ApiOperation("修改状态")
    @PostMapping("/status/{id}")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setStatus(status);
        sysUserMapper.updateById(user);
        return Result.success();
    }
}
