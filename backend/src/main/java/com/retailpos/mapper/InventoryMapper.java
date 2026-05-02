package com.retailpos.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retailpos.entity.Inventory;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface InventoryMapper extends BaseMapper<Inventory> {
}
