package com.retailpos.engine;

import com.retailpos.entity.Inventory;
import com.retailpos.mapper.InventoryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryMapper inventoryMapper;

    @Transactional
    public void deductStock(Long storeId, Long productId, Integer quantity) {
        Inventory inventory = inventoryMapper.selectOne(
            new LambdaQueryWrapper<Inventory>()
                .eq(Inventory::getStoreId, storeId)
                .eq(Inventory::getProductId, productId)
        );

        if (inventory == null) {
            log.warn("库存记录不存在: storeId={}, productId={}", storeId, productId);
            return;
        }

        if (inventory.getQuantity() < quantity) {
            throw new RuntimeException("库存不足");
        }

        inventory.setQuantity(inventory.getQuantity() - quantity);
        inventoryMapper.updateById(inventory);

        log.info("库存扣减: storeId={}, productId={}, quantity={}, remaining={}",
                storeId, productId, quantity, inventory.getQuantity());
    }

    @Transactional
    public void addStock(Long storeId, Long productId, Integer quantity) {
        Inventory inventory = inventoryMapper.selectOne(
            new LambdaQueryWrapper<Inventory>()
                .eq(Inventory::getStoreId, storeId)
                .eq(Inventory::getProductId, productId)
        );

        if (inventory == null) {
            inventory = new Inventory();
            inventory.setStoreId(storeId);
            inventory.setProductId(productId);
            inventory.setQuantity(quantity);
            inventory.setLowStockThreshold(10);
            inventoryMapper.insert(inventory);
            log.info("库存创建: storeId={}, productId={}, quantity={}", storeId, productId, quantity);
        } else {
            inventory.setQuantity(inventory.getQuantity() + quantity);
            inventoryMapper.updateById(inventory);
            log.info("库存增加: storeId={}, productId={}, quantity={}, newTotal={}",
                    storeId, productId, quantity, inventory.getQuantity());
        }
    }

    public Integer getStock(Long storeId, Long productId) {
        Inventory inventory = inventoryMapper.selectOne(
            new LambdaQueryWrapper<Inventory>()
                .eq(Inventory::getStoreId, storeId)
                .eq(Inventory::getProductId, productId)
        );

        return inventory != null ? inventory.getQuantity() : 0;
    }

    public boolean isLowStock(Long storeId, Long productId) {
        Inventory inventory = inventoryMapper.selectOne(
            new LambdaQueryWrapper<Inventory>()
                .eq(Inventory::getStoreId, storeId)
                .eq(Inventory::getProductId, productId)
        );

        if (inventory == null) {
            return true;
        }

        return inventory.getQuantity() <= inventory.getLowStockThreshold();
    }
}
