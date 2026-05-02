package com.retail.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.retail.common.result.Result;
import com.retail.domain.entity.InvStock;
import com.retail.domain.entity.ProdProduct;
import com.retail.domain.entity.SysOrg;
import com.retail.mapper.InvStockMapper;
import com.retail.mapper.ProdProductMapper;
import com.retail.mapper.SysOrgMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Api(tags = "库存管理接口")
@RestController
@RequestMapping("/inventory")
public class InventoryController {

    @Resource
    private InvStockMapper invStockMapper;

    @Resource
    private ProdProductMapper prodProductMapper;

    @Resource
    private SysOrgMapper sysOrgMapper;

    @ApiOperation("查询门店库存")
    @GetMapping("/org/{orgId}")
    public Result<List<InvStock>> getStockByOrgId(@PathVariable Long orgId) {
        List<InvStock> stocks = invStockMapper.selectByOrgId(orgId);
        return Result.success(stocks);
    }

    @ApiOperation("查询门店某商品库存")
    @GetMapping("/org/{orgId}/product/{productId}")
    public Result<InvStock> getStockByOrgAndProduct(
            @PathVariable Long orgId,
            @PathVariable Long productId) {
        InvStock stock = invStockMapper.selectByOrgAndProduct(orgId, productId);
        if (stock == null) {
            stock = new InvStock();
            stock.setOrgId(orgId);
            stock.setProductId(productId);
            stock.setQuantity(BigDecimal.ZERO);
            stock.setLockedQuantity(BigDecimal.ZERO);
        }
        return Result.success(stock);
    }

    @ApiOperation("查询低库存商品")
    @GetMapping("/low-stock/{orgId}")
    public Result<List<InvStock>> getLowStock(@PathVariable Long orgId) {
        List<InvStock> stocks = invStockMapper.selectLowStockByOrgId(orgId);
        return Result.success(stocks);
    }

    @ApiOperation("初始化门店库存")
    @PostMapping("/init/{orgId}")
    public Result<Void> initOrgStock(@PathVariable Long orgId) {
        SysOrg org = sysOrgMapper.selectById(orgId);
        if (org == null) {
            return Result.error("组织不存在");
        }
        List<ProdProduct> products = prodProductMapper.selectList(
                new LambdaQueryWrapper<ProdProduct>()
                        .eq(ProdProduct::getDeleted, 0)
                        .eq(ProdProduct::getStatus, 1)
        );
        for (ProdProduct product : products) {
            InvStock existing = invStockMapper.selectByOrgAndProduct(orgId, product.getId());
            if (existing == null) {
                InvStock stock = new InvStock();
                stock.setOrgId(orgId);
                stock.setProductId(product.getId());
                stock.setQuantity(BigDecimal.ZERO);
                stock.setLockedQuantity(BigDecimal.ZERO);
                stock.setSafetyStock(BigDecimal.ZERO);
                invStockMapper.insert(stock);
            }
        }
        return Result.success();
    }

    @ApiOperation("获取库存统计")
    @GetMapping("/stats/{orgId}")
    public Result<Map<String, Object>> getStockStats(@PathVariable Long orgId) {
        List<InvStock> stocks = invStockMapper.selectByOrgId(orgId);
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalItems", stocks.size());
        stats.put("lowStockCount", (int) stocks.stream()
                .filter(s -> s.getQuantity().compareTo(s.getSafetyStock()) <= 0)
                .count());
        stats.put("outOfStockCount", (int) stocks.stream()
                .filter(s -> s.getQuantity().compareTo(BigDecimal.ZERO) <= 0)
                .count());
        return Result.success(stats);
    }
}
