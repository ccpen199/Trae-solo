package com.retailpos.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retailpos.entity.Store;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface StoreMapper extends BaseMapper<Store> {
}
