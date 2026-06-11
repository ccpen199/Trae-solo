package com.guizhou.platform.payment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.payment.entity.BillInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface BillInfoMapper extends BaseMapper<BillInfo> {

    @Select("SELECT * FROM bill_info WHERE deleted = 0 AND account_no = #{accountNo} AND bill_type = #{billType} ORDER BY bill_month DESC")
    List<BillInfo> listByAccountNoAndType(@Param("accountNo") String accountNo, @Param("billType") Integer billType);

    @Select("SELECT * FROM bill_info WHERE deleted = 0 AND account_no = #{accountNo} AND bill_type = #{billType} AND bill_month = #{billMonth}")
    BillInfo getByAccountAndMonth(@Param("accountNo") String accountNo, @Param("billType") Integer billType, @Param("billMonth") String billMonth);
}
