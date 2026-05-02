package com.retailpos.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retailpos.entity.Users;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UsersMapper extends BaseMapper<Users> {
}
