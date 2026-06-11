package com.guizhou.platform.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TicketCreateDTO {

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "内容不能为空")
    private String content;

    private Integer category;

    private Integer priority;

    @NotNull(message = "来源不能为空")
    private Integer source;

    @NotBlank(message = "市民姓名不能为空")
    private String citizenName;

    @NotBlank(message = "市民电话不能为空")
    private String citizenPhone;

    private String citizenIdCard;

    private String regionCode;

    private String regionName;

    private String address;

    private String attachment;
}
