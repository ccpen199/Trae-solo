package com.retail.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.retail.domain.entity.ProdCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface ProdCategoryMapper extends BaseMapper<ProdCategory> {

    @Select("SELECT * FROM prod_category WHERE parent_id = #{parentId} AND deleted = 0 ORDER BY sort")
    List<ProdCategory> selectByParentId(@Param("parentId") Long parentId);

    @Select("SELECT * FROM prod_category WHERE category_code = #{categoryCode} AND deleted = 0")
    ProdCategory selectByCategoryCode(@Param("categoryCode") String categoryCode);

    @Select("SELECT * FROM prod_category WHERE path LIKE CONCAT(#{path}, '%') AND deleted = 0 ORDER BY path")
    List<ProdCategory> selectByPathLike(@Param("path") String path);
}
