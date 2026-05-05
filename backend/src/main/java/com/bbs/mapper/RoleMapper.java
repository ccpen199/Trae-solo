package com.bbs.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bbs.entity.Role;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface RoleMapper extends BaseMapper<Role> {
    
    @Select("SELECT p.* FROM permissions p " +
            "INNER JOIN role_permissions rp ON p.id = rp.permission_id " +
            "WHERE rp.role_id = #{roleId} AND p.status = 1 AND p.deleted = false " +
            "ORDER BY p.sort ASC")
    List<com.bbs.entity.Permission> selectPermissionsByRoleId(@Param("roleId") Long roleId);
}
