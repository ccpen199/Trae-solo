package com.guizhou.platform.ticket.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.ticket.entity.TicketProcess;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface TicketProcessMapper extends BaseMapper<TicketProcess> {

    @Select("SELECT * FROM ticket_process WHERE deleted = 0 AND ticket_id = #{ticketId} ORDER BY process_time ASC")
    List<TicketProcess> listByTicketId(@Param("ticketId") Long ticketId);
}
