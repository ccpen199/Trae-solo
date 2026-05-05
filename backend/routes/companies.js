const express = require('express');
const router = express.Router();

const mockCompanies = [
  {
    id: 'C001',
    name: 'Shenzhen Electronics Co., Ltd.',
    product_service: 'Consumer Electronics, Smart Devices, Audio Equipment',
    country: 'China',
    online_status: 'online',
    established_year: 2010,
    employee_count: '500-1000',
    main_products: ['Bluetooth Earbuds', 'Smart Watches', 'Charging Cables'],
    certification: ['ISO 9001', 'CE', 'FCC'],
    business_type: 'Manufacturer',
    annual_revenue: '$50M - $100M',
    logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electronics%20company%20logo%20minimalist%20design&image_size=square'
  },
  {
    id: 'C002',
    name: 'GreenLife Products Factory',
    product_service: 'Eco-Friendly Products, Bamboo Items, Sustainable Packaging',
    country: 'Vietnam',
    online_status: 'offline',
    established_year: 2015,
    employee_count: '200-500',
    main_products: ['Bamboo Bottles', 'Eco Bags', 'Paper Packaging'],
    certification: ['FSC', 'ISO 14001'],
    business_type: 'Manufacturer & Trading',
    annual_revenue: '$10M - $50M',
    logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=eco%20friendly%20green%20company%20logo%20leaf%20design&image_size=square'
  },
  {
    id: 'C003',
    name: 'Bangladesh Apparel Manufacturing',
    product_service: 'Clothing, Textiles, Custom Apparel Production',
    country: 'Bangladesh',
    online_status: 'online',
    established_year: 2008,
    employee_count: '1000-2000',
    main_products: ['T-Shirts', 'Jeans', 'Sportswear'],
    certification: ['OEKO-TEX', 'BSCI'],
    business_type: 'OEM/ODM Manufacturer',
    annual_revenue: '$100M+',
    logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=apparel%20clothing%20company%20logo%20fashion%20brand&image_size=square'
  },
  {
    id: 'C004',
    name: 'Korea Home Goods Inc.',
    product_service: 'Kitchenware, Home Decor, Household Products',
    country: 'South Korea',
    online_status: 'online',
    established_year: 2012,
    employee_count: '100-200',
    main_products: ['Kitchen Utensils', 'Storage Solutions', 'Cookware'],
    certification: ['KC Mark', 'FDA'],
    business_type: 'Trading Company',
    annual_revenue: '$5M - $10M',
    logo_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=home%20goods%20kitchenware%20company%20logo%20korean%20style&image_size=square'
  }
];

router.get('/', (req, res) => {
  const { page = 1, limit = 10, country } = req.query;
  let filteredCompanies = [...mockCompanies];

  if (country) {
    filteredCompanies = filteredCompanies.filter(c => c.country === country);
  }

  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  res.json({
    companies: paginatedCompanies,
    total: filteredCompanies.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filteredCompanies.length / parseInt(limit))
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const company = mockCompanies.find(c => c.id === id);

  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  res.json({ company });
});

module.exports = router;
