package com.guizhou.platform.ticket.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.ticket.entity.TicketCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TicketCategoryMapper extends BaseMapper<TicketCategory> {

    @Select("SELECT * FROM ticket_category WHERE deleted = 0 AND category_status = 1 ORDER BY sort_order ASC")
    List<TicketCategory> listActive();

    @Select("SELECT * FROM ticket_category WHERE deleted = 0 AND keywords LIKE CONCAT('%', #{keyword}, '%') AND category_status = 1")
    List<TicketCategory> findByKeyword(@Param("keyword") String keyword);
}
