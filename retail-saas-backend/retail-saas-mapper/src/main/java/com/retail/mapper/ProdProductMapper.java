package com.retail.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retail.domain.entity.ProdProduct;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProdProductMapper extends BaseMapper<ProdProduct> {

    @Select("SELECT * FROM prod_product WHERE sku_code = #{skuCode} AND deleted = 0")
    ProdProduct selectBySkuCode(@Param("skuCode") String skuCode);

    @Select("SELECT * FROM prod_product WHERE category_id = #{categoryId} AND deleted = 0 ORDER BY sku_code")
    List<ProdProduct> selectByCategoryId(@Param("categoryId") Long categoryId);

    @Select("SELECT * FROM prod_product WHERE barcode = #{barcode} AND deleted = 0")
    ProdProduct selectByBarcode(@Param("barcode") String barcode);
}
