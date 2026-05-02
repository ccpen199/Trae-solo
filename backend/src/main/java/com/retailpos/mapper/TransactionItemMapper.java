package com.retailpos.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retailpos.entity.TransactionItem;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TransactionItemMapper extends BaseMapper<TransactionItem> {
}
