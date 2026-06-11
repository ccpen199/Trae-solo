package com.guizhou.platform.auth.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.auth.dto.RoleDTO;
import com.guizhou.platform.auth.entity.SysPermission;
import com.guizhou.platform.auth.entity.SysRole;
import com.guizhou.platform.auth.entity.SysRolePermission;
import com.guizhou.platform.auth.mapper.SysPermissionMapper;
import com.guizhou.platform.auth.mapper.SysRoleMapper;
import com.guizhou.platform.auth.mapper.SysRolePermissionMapper;
import com.guizhou.platform.auth.service.RoleService;
import com.guizhou.platform.auth.vo.RoleVO;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.common.result.ResultCode;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class RoleServiceImpl extends ServiceImpl<SysRoleMapper, SysRole> implements RoleService {

    @Resource
    private SysRoleMapper roleMapper;

    @Resource
    private SysRolePermissionMapper rolePermissionMapper;

    @Resource
    private SysPermissionMapper permissionMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createRole(RoleDTO dto) {
        SysRole existRole = roleMapper.selectByRoleCode(dto.getRoleCode());
        if (existRole != null) {
            throw new BusinessException(ResultCode.DATA_ALREADY_EXIST, "角色编码已存在");
        }

        SysRole role = new SysRole();
        BeanUtils.copyProperties(dto, role);
        role.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);
        this.save(role);

        if (dto.getPermissionIds() != null && !dto.getPermissionIds().isEmpty()) {
            assignPermissions(role.getId(), dto.getPermissionIds());
        }

        return role.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateRole(RoleDTO dto) {
        if (dto.getId() == null) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "角色ID不能为空");
        }
        SysRole role = this.getById(dto.getId());
        if (role == null) {
            throw new BusinessException(ResultCode.ROLE_NOT_EXIST);
        }

        if (dto.getRoleCode() != null && !dto.getRoleCode().equals(role.getRoleCode())) {
            SysRole existRole = roleMapper.selectByRoleCode(dto.getRoleCode());
            if (existRole != null) {
                throw new BusinessException(ResultCode.DATA_ALREADY_EXIST, "角色编码已存在");
            }
            role.setRoleCode(dto.getRoleCode());
        }
        if (dto.getRoleName() != null) role.setRoleName(dto.getRoleName());
        if (dto.getRoleDesc() != null) role.setRoleDesc(dto.getRoleDesc());
        if (dto.getStatus() != null) role.setStatus(dto.getStatus());
        if (dto.getSort() != null) role.setSort(dto.getSort());
        if (dto.getDataScope() != null) role.setDataScope(dto.getDataScope());
        if (dto.getRemark() != null) role.setRemark(dto.getRemark());

        this.updateById(role);

        if (dto.getPermissionIds() != null) {
            assignPermissions(role.getId(), dto.getPermissionIds());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteRole(Long roleId) {
        SysRole role = this.getById(roleId);
        if (role == null) {
            throw new BusinessException(ResultCode.ROLE_NOT_EXIST);
        }
        this.removeById(roleId);
        rolePermissionMapper.deleteByRoleId(roleId);
    }

    @Override
    public RoleVO getRoleDetail(Long roleId) {
        SysRole role = this.getById(roleId);
        if (role == null) {
            throw new BusinessException(ResultCode.ROLE_NOT_EXIST);
        }

        List<SysPermission> permissions = permissionMapper.selectByRoleId(roleId);
        List<Long> permissionIds = permissions.stream().map(SysPermission::getId).collect(Collectors.toList());

        return RoleVO.builder()
                .id(role.getId())
                .roleCode(role.getRoleCode())
                .roleName(role.getRoleName())
                .roleDesc(role.getRoleDesc())
                .status(role.getStatus())
                .sort(role.getSort())
                .dataScope(role.getDataScope())
                .permissionIds(permissionIds)
                .createTime(role.getCreateTime())
                .remark(role.getRemark())
                .build();
    }

    @Override
    public PageResult<RoleVO> pageRoles(Integer pageNum, Integer pageSize, String roleName, String roleCode, Integer status) {
        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<>();
        if (roleName != null && !roleName.isEmpty()) {
            wrapper.like(SysRole::getRoleName, roleName);
        }
        if (roleCode != null && !roleCode.isEmpty()) {
            wrapper.like(SysRole::getRoleCode, roleCode);
        }
        if (status != null) {
            wrapper.eq(SysRole::getStatus, status);
        }
        wrapper.orderByAsc(SysRole::getSort).orderByDesc(SysRole::getCreateTime);

        Page<SysRole> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        List<RoleVO> voList = page.getRecords().stream()
                .map(this::buildRoleVO)
                .collect(Collectors.toList());

        return PageResult.of(page.getTotal(), voList, pageNum, pageSize);
    }

    @Override
    public List<RoleVO> listAllRoles() {
        List<SysRole> list = this.list(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getStatus, 1)
                .orderByAsc(SysRole::getSort));
        return list.stream().map(this::buildRoleVO).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void assignPermissions(Long roleId, List<Long> permissionIds) {
        SysRole role = this.getById(roleId);
        if (role == null) {
            throw new BusinessException(ResultCode.ROLE_NOT_EXIST);
        }
        rolePermissionMapper.deleteByRoleId(roleId);
        if (permissionIds != null && !permissionIds.isEmpty()) {
            for (Long permissionId : permissionIds) {
                SysRolePermission rp = new SysRolePermission();
                rp.setRoleId(roleId);
                rp.setPermissionId(permissionId);
                rolePermissionMapper.insert(rp);
            }
        }
    }

    private RoleVO buildRoleVO(SysRole role) {
        return RoleVO.builder()
                .id(role.getId())
                .roleCode(role.getRoleCode())
                .roleName(role.getRoleName())
                .roleDesc(role.getRoleDesc())
                .status(role.getStatus())
                .sort(role.getSort())
                .dataScope(role.getDataScope())
                .createTime(role.getCreateTime())
                .remark(role.getRemark())
                .build();
    }
}
