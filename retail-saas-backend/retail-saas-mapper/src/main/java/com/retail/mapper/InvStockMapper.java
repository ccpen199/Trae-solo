package com.retail.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retail.domain.entity.InvStock;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface InvStockMapper extends BaseMapper<InvStock> {

    @Select("SELECT * FROM inv_stock WHERE org_id = #{orgId} AND product_id = #{productId} AND deleted = 0")
    InvStock selectByOrgAndProduct(@Param("orgId") Long orgId, @Param("productId") Long productId);

    @Select("SELECT * FROM inv_stock WHERE org_id = #{orgId} AND deleted = 0 ORDER BY product_id")
    List<InvStock> selectByOrgId(@Param("orgId") Long orgId);

    @Select("SELECT * FROM inv_stock WHERE org_id = #{orgId} AND quantity <= safety_stock AND deleted = 0")
    List<InvStock> selectLowStockByOrgId(@Param("orgId") Long orgId);

    @Update("UPDATE inv_stock SET quantity = quantity + #{changeQty}, version = version + 1 " +
            "WHERE id = #{id} AND version = #{version}")
    int updateStockWithVersion(@Param("id") Long id, @Param("changeQty") java.math.BigDecimal changeQty, @Param("version") Integer version);
}
