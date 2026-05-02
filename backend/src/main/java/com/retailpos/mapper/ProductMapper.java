package com.retailpos.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retailpos.entity.Product;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ProductMapper extends BaseMapper<Product> {
}
