package com.guizhou.platform.auth.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.auth.dto.RoleDTO;
import com.guizhou.platform.auth.entity.SysRole;
import com.guizhou.platform.auth.vo.RoleVO;
import com.guizhou.platform.common.base.PageResult;

import java.util.List;

public interface RoleService extends IService<SysRole> {

    Long createRole(RoleDTO dto);

    void updateRole(RoleDTO dto);

    void deleteRole(Long roleId);

    RoleVO getRoleDetail(Long roleId);

    PageResult<RoleVO> pageRoles(Integer pageNum, Integer pageSize, String roleName, String roleCode, Integer status);

    List<RoleVO> listAllRoles();

    void assignPermissions(Long roleId, List<Long> permissionIds);
}
