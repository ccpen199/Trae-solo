
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/format';

interface ProductCardProps {
  product: Product;
  index?: number;
}

function ProductCard({ product, index = 0 }: ProductCardProps) {
  const displayPrice = product.channel === 'b2b' ? product.wholesalePrice : product.price;

  return (
    <motion.article
      className="product-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 + index * 0.06 }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
    >
      <div className="product-image-wrapper">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        <span className="channel-badge">{product.channel.toUpperCase()}</span>
      </div>
      <div className="product-body">
        <div className="card-headline">
          <div>
            <span>{product.category}</span>
            <h3>{product.name}</h3>
          </div>
        </div>
        <p>{product.seller}</p>
        <div className="price-row">
          <strong>{formatCurrency(displayPrice)}</strong>
          <span>MOQ {product.moq}</span>
        </div>
        <div className="tag-row">
          <span>{product.origin}</span>
          <span>{product.specification}</span>
          <span>库存 {product.stock}</span>
        </div>
        <NavLink to={`/trace?code=${encodeURIComponent(product.traceCode)}`} className="text-link">
          查看溯源 <ChevronRight size={16} />
        </NavLink>
      </div>
    </motion.article>
  );
}

export default ProductCard;
