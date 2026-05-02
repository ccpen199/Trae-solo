package com.retail.admin.vo;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MenuVO {

    private Long id;

    private Long parentId;

    private String menuName;

    private String menuType;

    private String path;

    private String component;

    private String permission;

    private String icon;

    private String redirect;

    private Integer sort;

    private Boolean visible;

    private List<MenuVO> children;
}
