package com.retail.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retail.domain.entity.SysRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SysRoleMapper extends BaseMapper<SysRole> {

    @Select("SELECT * FROM sys_role WHERE role_code = #{roleCode} AND deleted = 0")
    SysRole selectByRoleCode(@Param("roleCode") String roleCode);

    @Select("SELECT * FROM sys_role WHERE org_id = #{orgId} AND deleted = 0 ORDER BY sort_order")
    List<SysRole> selectByOrgId(@Param("orgId") Long orgId);

    @Select("SELECT r.* FROM sys_role r INNER JOIN sys_user_role ur ON r.id = ur.role_id WHERE ur.user_id = #{userId} AND r.deleted = 0")
    List<SysRole> selectByUserId(@Param("userId") Long userId);
}
