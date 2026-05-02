package com.retail.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retail.domain.entity.SysMenu;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SysMenuMapper extends BaseMapper<SysMenu> {

    @Select("SELECT * FROM sys_menu WHERE parent_id = #{parentId} AND deleted = 0 ORDER BY sort")
    List<SysMenu> selectByParentId(@Param("parentId") Long parentId);

    @Select("SELECT DISTINCT m.* FROM sys_menu m " +
            "INNER JOIN sys_role_menu rm ON m.id = rm.menu_id " +
            "INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id " +
            "WHERE ur.user_id = #{userId} AND m.deleted = 0 " +
            "ORDER BY m.sort")
    List<SysMenu> selectByUserId(@Param("userId") Long userId);

    @Select("SELECT DISTINCT m.permission FROM sys_menu m " +
            "INNER JOIN sys_role_menu rm ON m.id = rm.menu_id " +
            "INNER JOIN sys_user_role ur ON rm.role_id = ur.role_id " +
            "WHERE ur.user_id = #{userId} AND m.permission IS NOT NULL AND m.permission != ''")
    List<String> selectPermissionsByUserId(@Param("userId") Long userId);
}
