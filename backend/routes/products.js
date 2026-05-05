const express = require('express');
const router = express.Router();

const mockProducts = [
  {
    id: 'P001',
    title: 'Premium Wireless Bluetooth Earbuds - Noise Cancelling',
    min_order_quantity: 100,
    moq_unit: 'Pieces',
    fob_price_min: 12.50,
    fob_price_max: 18.00,
    price_currency: 'USD',
    company_id: 'C001',
    company_name: 'Shenzhen Electronics Co., Ltd.',
    country: 'China',
    online_status: 'online',
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20wireless%20bluetooth%20earbuds%20product%20photo%20white%20background&image_size=square',
    category: 'Electronics'
  },
  {
    id: 'P002',
    title: 'Eco-Friendly Bamboo Water Bottles - 500ml',
    min_order_quantity: 500,
    moq_unit: 'Pieces',
    fob_price_min: 3.50,
    fob_price_max: 6.00,
    price_currency: 'USD',
    company_id: 'C002',
    company_name: 'GreenLife Products Factory',
    country: 'Vietnam',
    online_status: 'offline',
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bamboo%20water%20bottle%20eco%20friendly%20product%20photo&image_size=square',
    category: 'Home & Garden'
  },
  {
    id: 'P003',
    title: 'Smart Fitness Watch - Heart Rate Monitor',
    min_order_quantity: 50,
    moq_unit: 'Pieces',
    fob_price_min: 25.00,
    fob_price_max: 45.00,
    price_currency: 'USD',
    company_id: 'C001',
    company_name: 'Shenzhen Electronics Co., Ltd.',
    country: 'China',
    online_status: 'online',
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20fitness%20watch%20with%20heart%20rate%20monitor%20product%20photo&image_size=square',
    category: 'Electronics'
  },
  {
    id: 'P004',
    title: 'Organic Cotton T-Shirts - Custom Logo',
    min_order_quantity: 200,
    moq_unit: 'Pieces',
    fob_price_min: 4.00,
    fob_price_max: 8.00,
    price_currency: 'USD',
    company_id: 'C003',
    company_name: 'Bangladesh Apparel Manufacturing',
    country: 'Bangladesh',
    online_status: 'online',
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=organic%20cotton%20tshirt%20folded%20product%20photo%20white%20background&image_size=square',
    category: 'Apparel'
  },
  {
    id: 'P005',
    title: 'Stainless Steel Kitchen Utensil Set - 12 Pieces',
    min_order_quantity: 100,
    moq_unit: 'Sets',
    fob_price_min: 8.50,
    fob_price_max: 15.00,
    price_currency: 'USD',
    company_id: 'C004',
    company_name: 'Korea Home Goods Inc.',
    country: 'South Korea',
    online_status: 'online',
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stainless%20steel%20kitchen%20utensils%20set%20product%20photo&image_size=square',
    category: 'Home & Garden'
  },
  {
    id: 'P006',
    title: 'USB-C Fast Charging Cable - Braided Nylon',
    min_order_quantity: 500,
    moq_unit: 'Pieces',
    fob_price_min: 1.20,
    fob_price_max: 2.50,
    price_currency: 'USD',
    company_id: 'C001',
    company_name: 'Shenzhen Electronics Co., Ltd.',
    country: 'China',
    online_status: 'online',
    image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=usb%20c%20fast%20charging%20cable%20braided%20product%20photo&image_size=square',
    category: 'Electronics'
  }
];

router.get('/', (req, res) => {
  const { page = 1, limit = 10, category } = req.query;
  let filteredProducts = [...mockProducts];

  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }

  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  res.json({
    products: paginatedProducts,
    total: filteredProducts.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filteredProducts.length / parseInt(limit))
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const product = mockProducts.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ product });
});

router.get('/company/:companyId', (req, res) => {
  const { companyId } = req.params;
  const products = mockProducts.filter(p => p.company_id === companyId);

  res.json({ products, total: products.length });
});

module.exports = router;
