package com.guizhou.platform.payment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.payment.entity.PaymentChannel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PaymentChannelMapper extends BaseMapper<PaymentChannel> {

    @Select("SELECT * FROM payment_channel WHERE deleted = 0 AND enabled = 1 ORDER BY priority ASC")
    List<PaymentChannel> listEnabled();

    @Select("SELECT * FROM payment_channel WHERE deleted = 0 AND channel_type = #{channelType} AND enabled = 1")
    PaymentChannel getByChannelType(@Param("channelType") Integer channelType);
}
