package com.retail.engine.inventory;

import java.math.BigDecimal;
import java.util.List;

public interface InventoryAllocationEngine {

    StockOperationResult updateStock(Long orgId, Long productId, BigDecimal changeQty, 
                                      String journalType, String refType, Long refId);

    StockOperationResult lockStock(Long orgId, Long productId, BigDecimal quantity);

    StockOperationResult unlockStock(Long orgId, Long productId, BigDecimal quantity);

    TransferResult processTransferOut(Long requisitionId, Long fromOrgId);

    TransferResult processTransferIn(Long requisitionId, Long toOrgId);

    List<StockAlert> checkLowStock(Long orgId);

    BigDecimal getAvailableStock(Long orgId, Long productId);
}
