package com.guizhou.platform.subsidyverify.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.guizhou.platform.subsidyverify.entity.SubsidyVoucher;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.math.BigDecimal;

@Mapper
public interface SubsidyVoucherMapper extends BaseMapper<SubsidyVoucher> {

    @Select("SELECT * FROM subsidy_voucher WHERE deleted = 0 AND voucher_no = #{voucherNo}")
    SubsidyVoucher getByVoucherNo(@Param("voucherNo") String voucherNo);

    @Select("SELECT COUNT(*) FROM subsidy_voucher WHERE deleted = 0 AND beneficiary_id = #{beneficiaryId} AND voucher_status = 0")
    Long countUnusedByBeneficiary(@Param("beneficiaryId") Long beneficiaryId);

    @Update("UPDATE subsidy_voucher SET used_amount = used_amount + #{amount}, remaining_amount = remaining_amount - #{amount}, " +
            "voucher_status = CASE WHEN remaining_amount - #{amount} <= 0 THEN 2 ELSE 1 END, " +
            "used_time = NOW(), update_time = NOW() WHERE id = #{id} AND deleted = 0 AND remaining_amount >= #{amount}")
    int deductAmount(@Param("id") Long id, @Param("amount") BigDecimal amount);

    @Update("UPDATE subsidy_voucher SET voucher_status = 3, update_time = NOW() " +
            "WHERE deleted = 0 AND voucher_status = 0 AND expiry_time < NOW()")
    int expireOverdueVouchers();
}
