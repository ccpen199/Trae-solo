package com.guizhou.platform.ticket.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.ticket.entity.Ticket;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface TicketMapper extends BaseMapper<Ticket> {

    @Select("SELECT COUNT(*) FROM ticket WHERE deleted = 0 AND status = #{status}")
    Long countByStatus(@Param("status") Integer status);

    @Select("SELECT COUNT(*) FROM ticket WHERE deleted = 0 AND create_time >= #{startTime}")
    Long countByCreateTime(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT COUNT(*) FROM ticket WHERE deleted = 0 AND status = #{status} AND deadline < NOW()")
    Long countOverdue(@Param("status") Integer status);

    @Update("UPDATE ticket SET status = #{status}, update_time = NOW() WHERE id = #{id} AND deleted = 0")
    int updateStatus(@Param("id") Long id, @Param("status") Integer status);

    @Select("SELECT category, COUNT(*) as cnt FROM ticket WHERE deleted = 0 AND create_time >= #{startTime} GROUP BY category ORDER BY cnt DESC")
    List<Map<String, Object>> countByCategory(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT region_code, region_name, COUNT(*) as cnt FROM ticket WHERE deleted = 0 AND create_time >= #{startTime} GROUP BY region_code, region_name ORDER BY cnt DESC")
    List<Map<String, Object>> countByRegion(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT DATE_FORMAT(create_time, '%Y-%m-%d') as date, COUNT(*) as cnt FROM ticket WHERE deleted = 0 AND create_time >= #{startTime} GROUP BY DATE_FORMAT(create_time, '%Y-%m-%d') ORDER BY date")
    List<Map<String, Object>> countByDate(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT AVG(TIMESTAMPDIFF(HOUR, create_time, complete_time)) FROM ticket WHERE deleted = 0 AND complete_time IS NOT NULL AND create_time >= #{startTime}")
    Double avgProcessHours(@Param("startTime") LocalDateTime startTime);

    @Select("SELECT COUNT(*) FROM ticket WHERE deleted = 0 AND satisfaction >= 4 AND complete_time IS NOT NULL")
    Long countSatisfied();

    @Select("SELECT COUNT(*) FROM ticket WHERE deleted = 0 AND complete_time IS NOT NULL")
    Long countCompleted();
}
