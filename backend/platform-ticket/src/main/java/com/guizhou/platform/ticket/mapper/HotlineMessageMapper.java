package com.guizhou.platform.ticket.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.ticket.entity.HotlineMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface HotlineMessageMapper extends BaseMapper<HotlineMessage> {

    @Select("SELECT COUNT(*) FROM hotline_message WHERE deleted = 0 AND process_status = #{status}")
    Long countByProcessStatus(@Param("status") Integer status);

    @Select("SELECT COUNT(*) FROM hotline_message WHERE deleted = 0 AND call_time >= #{startTime}")
    Long countByCallTime(@Param("startTime") java.time.LocalDateTime startTime);
}
