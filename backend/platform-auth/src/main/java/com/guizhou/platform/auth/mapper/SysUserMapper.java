package com.guizhou.platform.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.auth.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    @Select("SELECT * FROM sys_user WHERE deleted = 0 AND username = #{username}")
    SysUser selectByUsername(@Param("username") String username);

    @Select("SELECT * FROM sys_user WHERE deleted = 0 AND phone = #{phone}")
    SysUser selectByPhone(@Param("phone") String phone);

    @Select("SELECT * FROM sys_user WHERE deleted = 0 AND openid = #{openid}")
    SysUser selectByOpenid(@Param("openid") String openid);

    @Select("SELECT * FROM sys_user WHERE deleted = 0 AND alipay_id = #{alipayId}")
    SysUser selectByAlipayId(@Param("alipayId") String alipayId);

    @Update("UPDATE sys_user SET login_fail_count = login_fail_count + 1, update_time = NOW() WHERE id = #{userId} AND deleted = 0")
    int incrementLoginFailCount(@Param("userId") Long userId);

    @Update("UPDATE sys_user SET login_fail_count = 0, lock_time = NULL, update_time = NOW() WHERE id = #{userId} AND deleted = 0")
    int resetLoginFailCount(@Param("userId") Long userId);

    @Update("UPDATE sys_user SET lock_time = #{lockTime}, update_time = NOW() WHERE id = #{userId} AND deleted = 0")
    int updateLockTime(@Param("userId") Long userId, @Param("lockTime") java.time.LocalDateTime lockTime);

    @Update("UPDATE sys_user SET last_login_time = #{loginTime}, last_login_ip = #{loginIp}, login_fail_count = 0, lock_time = NULL, update_time = NOW() WHERE id = #{userId} AND deleted = 0")
    int updateLoginInfo(@Param("userId") Long userId, @Param("loginTime") java.time.LocalDateTime loginTime, @Param("loginIp") String loginIp);
}
