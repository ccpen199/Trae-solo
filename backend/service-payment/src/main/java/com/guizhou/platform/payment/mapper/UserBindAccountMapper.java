package com.guizhou.platform.payment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.payment.entity.UserBindAccount;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface UserBindAccountMapper extends BaseMapper<UserBindAccount> {

    @Select("SELECT * FROM user_bind_account WHERE deleted = 0 AND user_id = #{userId} ORDER BY is_default DESC, create_time DESC")
    List<UserBindAccount> listByUserId(@Param("userId") Long userId);

    @Select("SELECT * FROM user_bind_account WHERE deleted = 0 AND user_id = #{userId} AND bill_type = #{billType} ORDER BY is_default DESC, create_time DESC")
    List<UserBindAccount> listByUserIdAndType(@Param("userId") Long userId, @Param("billType") Integer billType);

    @Select("SELECT * FROM user_bind_account WHERE deleted = 0 AND user_id = #{userId} AND account_no = #{accountNo} AND bill_type = #{billType}")
    UserBindAccount getByUserAndAccount(@Param("userId") Long userId, @Param("accountNo") String accountNo, @Param("billType") Integer billType);
}
