package com.retail.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.retail.common.result.Result;
import com.retail.domain.entity.SysOrg;
import com.retail.mapper.SysOrgMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.List;

@Api(tags = "组织管理接口")
@RestController
@RequestMapping("/org")
public class OrgController {

    @Resource
    private SysOrgMapper sysOrgMapper;

    @ApiOperation("获取组织树")
    @GetMapping("/tree")
    public Result<List<SysOrg>> getOrgTree() {
        List<SysOrg> orgs = sysOrgMapper.selectList(
                new LambdaQueryWrapper<SysOrg>()
                        .eq(SysOrg::getDeleted, 0)
                        .orderByAsc(SysOrg::getSortOrder)
        );
        return Result.success(orgs);
    }

    @ApiOperation("分页查询组织")
    @GetMapping("/page")
    public Result<Page<SysOrg>> getOrgPage(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String orgName,
            @RequestParam(required = false) String orgType) {
        Page<SysOrg> page = new Page<>(current, size);
        LambdaQueryWrapper<SysOrg> wrapper = new LambdaQueryWrapper<SysOrg>()
                .eq(SysOrg::getDeleted, 0)
                .like(orgName != null, SysOrg::getOrgName, orgName)
                .eq(orgType != null, SysOrg::getOrgType, orgType)
                .orderByAsc(SysOrg::getSortOrder);
        Page<SysOrg> result = sysOrgMapper.selectPage(page, wrapper);
        return Result.success(result);
    }

    @ApiOperation("根据ID获取组织")
    @GetMapping("/{id}")
    public Result<SysOrg> getOrgById(@PathVariable Long id) {
        SysOrg org = sysOrgMapper.selectById(id);
        return Result.success(org);
    }

    @ApiOperation("创建组织")
    @PostMapping
    public Result<SysOrg> createOrg(@RequestBody SysOrg org) {
        org.setPath(buildOrgPath(org.getParentId()));
        sysOrgMapper.insert(org);
        return Result.success(org);
    }

    @ApiOperation("更新组织")
    @PutMapping
    public Result<SysOrg> updateOrg(@RequestBody SysOrg org) {
        sysOrgMapper.updateById(org);
        return Result.success(org);
    }

    @ApiOperation("删除组织")
    @DeleteMapping("/{id}")
    public Result<Void> deleteOrg(@PathVariable Long id) {
        SysOrg org = new SysOrg();
        org.setId(id);
        org.setDeleted(1);
        sysOrgMapper.updateById(org);
        return Result.success();
    }

    private String buildOrgPath(Long parentId) {
        if (parentId == null || parentId == 0) {
            return ",0,";
        }
        SysOrg parent = sysOrgMapper.selectById(parentId);
        if (parent == null) {
            return ",0,";
        }
        return parent.getPath() + parentId + ",";
    }
}
