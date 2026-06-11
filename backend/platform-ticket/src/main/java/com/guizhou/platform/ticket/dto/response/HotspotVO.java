package com.guizhou.platform.ticket.dto.response;

import lombok.Data;

@Data
public class HotspotVO {

    private String name;

    private String type;

    private Long count;

    private Double percentage;

    private String trend;

    private String regionCode;

    private String regionName;
}
