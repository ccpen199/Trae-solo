package com.guizhou.platform.datashare.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.Map;

@Data
public class DataRouteDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private String apiCode;

    private String requestMethod;

    private Map<String, Object> requestParams;

    private Map<String, String> headers;

    private String userId;

    private String roleCode;

    private String deptCode;
}
