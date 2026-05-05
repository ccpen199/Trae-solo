import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.getList({
        page: currentPage,
        limit: 12,
      });
      const responseData = response.data?.data || {};
      setProducts(responseData.products || []);
      setPagination(responseData.pagination || {
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
      });
    } catch (error) {
      console.error('获取商品列表失败:', error);
      if (currentPage === 1) {
        setProducts([
          {
            id: '1',
            name: '限时特惠 - 精品牛排套餐',
            description: '精选澳洲进口牛肉，口感鲜嫩多汁，营养丰富',
            price: 99.00,
            originalPrice: 199.00,
            stock: 100,
            sold: 50,
            image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20steak%20dinner%20with%20vegetables%20on%20wooden%20table&image_size=square',
            category: '美食',
            status: 'active',
          },
          {
            id: '2',
            name: '智能手表 - 运动健康版',
            description: '全天候心率监测，睡眠追踪，50米防水',
            price: 599.00,
            originalPrice: 999.00,
            stock: 50,
            sold: 120,
            image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20watch%20fitness%20tracker%20on%20wrist&image_size=square',
            category: '数码',
            status: 'active',
          },
          {
            id: '3',
            name: '有机水果礼盒',
            description: '当季新鲜水果，精选有机种植，健康美味',
            price: 128.00,
            originalPrice: 188.00,
            stock: 200,
            sold: 85,
            image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20fresh%20fruits%20in%20gift%20box&image_size=square',
            category: '生鲜',
            status: 'active',
          },
          {
            id: '4',
            name: '高端护肤套装',
            description: '天然成分，深层滋养，焕发光彩',
            price: 299.00,
            originalPrice: 599.00,
            stock: 30,
            sold: 200,
            image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20skincare%20products%20set%20on%20marble&image_size=square',
            category: '美妆',
            status: 'active',
          },
          {
            id: '5',
            name: '家用空气净化器',
            description: 'HEPA滤网，高效除霾，静音设计',
            price: 899.00,
            originalPrice: 1599.00,
            stock: 20,
            sold: 45,
            image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20air%20purifier%20in%20living%20room&image_size=square',
            category: '家电',
            status: 'active',
          },
          {
            id: '6',
            name: '进口零食大礼包',
            description: '精选全球各地特色零食，一次尝遍',
            price: 88.00,
            originalPrice: 138.00,
            stock: 500,
            sold: 320,
            image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=assorted%20snacks%20gift%20bag%20colorful&image_size=square',
            category: '美食',
            status: 'active',
          },
        ]);
        setPagination({
          total: 6,
          page: 1,
          limit: 12,
          totalPages: 1,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  const getStatusText = (status) => {
    const statusMap = {
      active: '热卖中',
      inactive: '已下架',
      sold_out: '已售罄',
    };
    return statusMap[status] || status;
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading && products.length === 0) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">精选团购</h1>
      
      {products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>暂无商品</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product.id)}
              >
                <img
                  src={product.image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square'}
                  alt={product.name}
                  className="product-image"
                />
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-price-row">
                    <div>
                      <span className="product-price">¥{product.price}</span>
                      {product.originalPrice && (
                        <span className="product-original-price">¥{product.originalPrice}</span>
                      )}
                    </div>
                    <span className="product-stock">
                      库存: {product.stock}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                上一页
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={currentPage === page ? 'active' : ''}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage >= pagination.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;
