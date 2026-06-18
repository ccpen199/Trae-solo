import { Route } from 'react-router-dom';
import ProductListPage from '../pages/goods/ProductListPage';
import ProductTracePage from '../pages/goods/ProductTracePage';
import InventoryPage from '../pages/goods/InventoryPage';
import PromotionPage from '../pages/goods/PromotionPage';

const goodsRoutes = (
  <>
    <Route path="goods/products" element={<ProductListPage />} />
    <Route path="goods/trace/:batchNo" element={<ProductTracePage />} />
    <Route path="goods/inventory" element={<InventoryPage />} />
    <Route path="goods/promotion" element={<PromotionPage />} />
  </>
);

export default goodsRoutes;
