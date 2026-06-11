package com.guizhou.platform.auth.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.auth.dto.UserDTO;
import com.guizhou.platform.auth.entity.SysPermission;
import com.guizhou.platform.auth.entity.SysRole;
import com.guizhou.platform.auth.entity.SysUser;
import com.guizhou.platform.auth.entity.SysUserRole;
import com.guizhou.platform.auth.mapper.SysPermissionMapper;
import com.guizhou.platform.auth.mapper.SysRoleMapper;
import com.guizhou.platform.auth.mapper.SysUserMapper;
import com.guizhou.platform.auth.mapper.SysUserRoleMapper;
import com.guizhou.platform.auth.service.UserService;
import com.guizhou.platform.auth.vo.UserInfoVO;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.common.result.ResultCode;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements UserService {

    @Resource
    private SysUserMapper userMapper;

    @Resource
    private SysRoleMapper roleMapper;

    @Resource
    private SysUserRoleMapper userRoleMapper;

    @Resource
    private SysPermissionMapper permissionMapper;

    @Resource
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createUser(UserDTO dto) {
        SysUser existUser = userMapper.selectByUsername(dto.getUsername());
        if (existUser != null) {
            throw new BusinessException(ResultCode.DATA_ALREADY_EXIST, "用户名已存在");
        }
        if (dto.getPhone() != null) {
            SysUser phoneUser = userMapper.selectByPhone(dto.getPhone());
            if (phoneUser != null) {
                throw new BusinessException(ResultCode.DATA_ALREADY_EXIST, "手机号已注册");
            }
        }

        SysUser user = new SysUser();
        BeanUtils.copyProperties(dto, user);
        if (dto.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        } else {
            user.setPassword(passwordEncoder.encode("123456"));
        }
        user.setLoginFailCount(0);
        user.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);
        this.save(user);

        if (dto.getRoleIds() != null && !dto.getRoleIds().isEmpty()) {
            assignRoles(user.getId(), dto.getRoleIds());
        }

        return user.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUser(UserDTO dto) {
        if (dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "用户ID不能为空");
        }
        SysUser user = this.getById(dto.getId());
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }

        if (dto.getUsername() != null && !dto.getUsername().equals(user.getUsername())) {
            SysUser existUser = userMapper.selectByUsername(dto.getUsername());
            if (existUser != null) {
                throw new BusinessException(ResultCode.DATA_ALREADY_EXIST, "用户名已存在");
            }
            user.setUsername(dto.getUsername());
        }
        if (dto.getNickname() != null) user.setNickname(dto.getNickname());
        if (dto.getRealName() != null) user.setRealName(dto.getRealName());
        if (dto.getIdCard() != null) user.setIdCard(dto.getIdCard());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getAvatar() != null) user.setAvatar(dto.getAvatar());
        if (dto.getGender() != null) user.setGender(dto.getGender());
        if (dto.getBirthday() != null) user.setBirthday(dto.getBirthday());
        if (dto.getAddress() != null) user.setAddress(dto.getAddress());
        if (dto.getStatus() != null) user.setStatus(dto.getStatus());
        if (dto.getRemark() != null) user.setRemark(dto.getRemark());
        if (dto.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        this.updateById(user);

        if (dto.getRoleIds() != null) {
            assignRoles(user.getId(), dto.getRoleIds());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteUser(Long userId) {
        SysUser user = this.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        this.removeById(userId);
        userRoleMapper.deleteByUserId(userId);
    }

    @Override
    public UserInfoVO getUserInfo(Long userId) {
        SysUser user = this.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        return buildUserInfoVO(user);
    }

    @Override
    public PageResult<UserInfoVO> pageUsers(Integer pageNum, Integer pageSize, String username, String phone, Integer status) {
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<>();
        if (username != null && !username.isEmpty()) {
            wrapper.like(SysUser::getUsername, username);
        }
        if (phone != null && !phone.isEmpty()) {
            wrapper.like(SysUser::getPhone, phone);
        }
        if (status != null) {
            wrapper.eq(SysUser::getStatus, status);
        }
        wrapper.orderByDesc(SysUser::getCreateTime);

        Page<SysUser> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        List<UserInfoVO> voList = page.getRecords().stream()
                .map(this::buildUserInfoVO)
                .collect(Collectors.toList());

        return PageResult.of(page.getTotal(), voList, pageNum, pageSize);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(Long userId, String newPassword) {
        SysUser user = this.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setLoginFailCount(0);
        user.setLockTime(null);
        this.updateById(user);
    }

    @Override
    public void updateStatus(Long userId, Integer status) {
        SysUser user = this.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        user.setStatus(status);
        this.updateById(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assignRoles(Long userId, List<Long> roleIds) {
        SysUser user = this.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_EXIST);
        }
        userRoleMapper.deleteByUserId(userId);
        if (roleIds != null && !roleIds.isEmpty()) {
            for (Long roleId : roleIds) {
                SysUserRole userRole = new SysUserRole();
                userRole.setUserId(userId);
                userRole.setRoleId(roleId);
                userRoleMapper.insert(userRole);
            }
        }
    }

    private UserInfoVO buildUserInfoVO(SysUser user) {
        List<SysRole> roles = roleMapper.selectByUserId(user.getId());
        List<String> roleCodes = roles.stream().map(SysRole::getRoleCode).collect(Collectors.toList());

        Set<String> permissions = permissionMapper.selectPermsByUserId(user.getId());

        return UserInfoVO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .realName(user.getRealName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .avatar(user.getAvatar())
                .gender(user.getGender())
                .birthday(user.getBirthday())
                .address(user.getAddress())
                .status(user.getStatus())
                .roles(roleCodes)
                .permissions(permissions)
                .lastLoginTime(user.getLastLoginTime())
                .lastLoginIp(user.getLastLoginIp())
                .build();
    }
}
