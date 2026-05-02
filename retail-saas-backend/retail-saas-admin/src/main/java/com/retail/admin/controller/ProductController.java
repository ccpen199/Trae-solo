package com.retail.admin.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.retail.common.result.Result;
import com.retail.domain.entity.ProdProduct;
import com.retail.mapper.ProdProductMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;

@Api(tags = "商品管理接口")
@RestController
@RequestMapping("/product")
public class ProductController {

    @Resource
    private ProdProductMapper prodProductMapper;

    @ApiOperation("分页查询商品")
    @GetMapping("/page")
    public Result<Page<ProdProduct>> getProductPage(
            @RequestParam(defaultValue = "1") Integer current,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String skuCode,
            @RequestParam(required = false) String skuName,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Integer status) {
        Page<ProdProduct> page = new Page<>(current, size);
        LambdaQueryWrapper<ProdProduct> wrapper = new LambdaQueryWrapper<ProdProduct>()
                .eq(ProdProduct::getDeleted, 0)
                .like(StringUtils.hasText(skuCode), ProdProduct::getSkuCode, skuCode)
                .like(StringUtils.hasText(skuName), ProdProduct::getSkuName, skuName)
                .eq(categoryId != null, ProdProduct::getCategoryId, categoryId)
                .eq(status != null, ProdProduct::getStatus, status)
                .orderByDesc(ProdProduct::getCreateTime);
        Page<ProdProduct> result = prodProductMapper.selectPage(page, wrapper);
        return Result.success(result);
    }

    @ApiOperation("根据ID获取商品")
    @GetMapping("/{id}")
    public Result<ProdProduct> getProductById(@PathVariable Long id) {
        ProdProduct product = prodProductMapper.selectById(id);
        return Result.success(product);
    }

    @ApiOperation("根据SKU获取商品")
    @GetMapping("/sku/{skuCode}")
    public Result<ProdProduct> getProductBySkuCode(@PathVariable String skuCode) {
        ProdProduct product = prodProductMapper.selectBySkuCode(skuCode);
        return Result.success(product);
    }

    @ApiOperation("创建商品")
    @PostMapping
    public Result<ProdProduct> createProduct(@RequestBody ProdProduct product) {
        if (product.getStatus() == null) {
            product.setStatus(1);
        }
        if (product.getIsManageStock() == null) {
            product.setIsManageStock(1);
        }
        prodProductMapper.insert(product);
        return Result.success(product);
    }

    @ApiOperation("更新商品")
    @PutMapping
    public Result<ProdProduct> updateProduct(@RequestBody ProdProduct product) {
        prodProductMapper.updateById(product);
        return Result.success(product);
    }

    @ApiOperation("删除商品")
    @DeleteMapping("/{id}")
    public Result<Void> deleteProduct(@PathVariable Long id) {
        ProdProduct product = new ProdProduct();
        product.setId(id);
        product.setDeleted(1);
        prodProductMapper.updateById(product);
        return Result.success();
    }

    @ApiOperation("修改商品状态")
    @PostMapping("/status/{id}")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        ProdProduct product = new ProdProduct();
        product.setId(id);
        product.setStatus(status);
        prodProductMapper.updateById(product);
        return Result.success();
    }
}
