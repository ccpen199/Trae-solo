package com.guizhou.platform.ticket.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.ticket.entity.Department;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface DepartmentMapper extends BaseMapper<Department> {

    @Select("SELECT * FROM department WHERE deleted = 0 AND dept_status = 1 ORDER BY sort_order ASC")
    List<Department> listActive();

    @Select("SELECT * FROM department WHERE deleted = 0 AND category_keywords LIKE CONCAT('%', #{keyword}, '%') AND dept_status = 1")
    List<Department> findByKeyword(@Param("keyword") String keyword);
}
