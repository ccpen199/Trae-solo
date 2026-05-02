package com.retail.domain.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_org")
public class SysOrg extends BaseEntity {

    private static final long serialVersionUID = 1L;

    private Long parentId;

    private String orgName;

    private String orgCode;

    private String orgType;

    private String path;

    private Long managerId;

    private String province;

    private String city;

    private String district;

    private String address;

    private String contact;

    private String phone;

    private Integer status;

    private Integer sortOrder;

    @TableField(exist = false)
    private List<SysOrg> children;

    @TableField(exist = false)
    private String parentName;

    public interface OrgType {
        String HEADQUARTERS = "HEADQUARTERS";
        String REGION = "REGION";
        String STORE = "STORE";
    }

    public interface Status {
        Integer ENABLED = 1;
        Integer DISABLED = 0;
    }
}
