import { useNavigate } from 'react-router-dom';

function ProductCard({ product }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <img
        src={product.image}
        alt={product.name}
        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
      />
      <div style={{ padding: '10px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ color: '#ff6b35', fontSize: '18px', fontWeight: 'bold' }}>¥{product.price}</span>
          {product.original_price > product.price && (
            <span style={{ color: '#999', fontSize: '12px', textDecoration: 'line-through' }}>¥{product.original_price}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
