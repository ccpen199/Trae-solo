package com.fooddelivery.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("print_task")
public class PrintTask extends BaseEntity {

    private Long orderId;

    private String orderNo;

    private Long storeId;

    private Integer printType;

    private String printerSn;

    private String printerName;

    private String templateCode;

    private String printContent;

    private Integer copies;

    private Integer printStatus;

    private LocalDateTime sendTime;

    private LocalDateTime printTime;

    private String printResult;

    private String errorMessage;

    private Integer retryCount;

    private String extInfo;
}
