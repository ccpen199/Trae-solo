package com.bbs.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bbs.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface UserMapper extends BaseMapper<User> {
    
    @Select("SELECT r.* FROM roles r " +
            "INNER JOIN user_roles ur ON r.id = ur.role_id " +
            "WHERE ur.user_id = #{userId} AND r.deleted = false")
    List<com.bbs.entity.Role> selectRolesByUserId(@Param("userId") Long userId);
    
    @Select("SELECT DISTINCT p.permission_code FROM permissions p " +
            "INNER JOIN role_permissions rp ON p.id = rp.permission_id " +
            "INNER JOIN user_roles ur ON rp.role_id = ur.role_id " +
            "WHERE ur.user_id = #{userId} AND p.status = 1 AND p.deleted = false")
    List<String> selectPermissionCodesByUserId(@Param("userId") Long userId);
    
    @Select("SELECT DISTINCT r.role_code FROM roles r " +
            "INNER JOIN user_roles ur ON r.id = ur.role_id " +
            "WHERE ur.user_id = #{userId} AND r.status = 1 AND r.deleted = false")
    List<String> selectRoleCodesByUserId(@Param("userId") Long userId);
}
