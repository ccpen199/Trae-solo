const bannerPlaceholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 225%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23ff6b35%22/%3E%3Ctext y=%2250%25%22 x=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 fill=%22white%22 font-size=%2224%22%3EBanner%3C/text%3E%3C/svg%3E'
const squarePlaceholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23f5f5f5%22/%3E%3Ctext y=%2250%25%22 x=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 fill=%22%23999%22 font-size=%2216%22%3EProduct%3C/text%3E%3C/svg%3E'
const videoPlaceholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 356%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%234a5568%22/%3E%3Ctext y=%2250%25%22 x=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 fill=%22white%22 font-size=%2218%22%3EVideo%3C/text%3E%3C/svg%3E'

export const categories = [
  { id: 1, name: 'Shucai', icon: '🥬', color: '#20c997' },
  { id: 2, name: 'Shuiguo', icon: '🍎', color: '#ff6b6b' },
  { id: 3, name: 'Roushi', icon: '🥩', color: '#fd7e14' },
  { id: 4, name: 'Haixian', icon: '🦐', color: '#4dabf7' },
  { id: 5, name: 'Ganhuo', icon: '🌰', color: '#69db7c' },
  { id: 6, name: 'Sushi', icon: '🍕', color: '#f783ac' },
  { id: 7, name: 'Jiupin', icon: '🍷', color: '#7950f2' },
  { id: 8, name: 'Tiaoliao', icon: '🧂', color: '#ced4da' },
  { id: 9, name: 'Chufang', icon: '🍳', color: '#fab005' },
]

export const banners = [
  { id: 1, image: bannerPlaceholder, url: '/coupon' },
  { id: 2, image: bannerPlaceholder, url: '/activity/seafood' },
  { id: 3, image: bannerPlaceholder, url: '/activity/meat' },
  { id: 4, image: bannerPlaceholder, url: '/activity/fruits' },
]

export const flashSaleProducts = [
  { id: 1, name: 'Organic Tomato', originalPrice: 12.8, price: 6.9, unit: '500g', image: squarePlaceholder, stock: 50, sold: 32 },
  { id: 2, name: 'Fresh Blueberry', originalPrice: 35.0, price: 19.9, unit: '125g', image: squarePlaceholder, stock: 30, sold: 28 },
  { id: 3, name: 'Pork Belly', originalPrice: 28.0, price: 18.8, unit: '500g', image: squarePlaceholder, stock: 45, sold: 15 },
  { id: 4, name: 'Live Shrimp', originalPrice: 48.0, price: 29.9, unit: '500g', image: squarePlaceholder, stock: 25, sold: 20 },
]

export const recommendProducts = [
  { id: 5, name: 'Red Fuji Apple', price: 15.9, unit: '4pcs', image: squarePlaceholder, sales: 2341 },
  { id: 6, name: 'Eggs', price: 28.0, unit: '30pcs', image: squarePlaceholder, sales: 1892 },
  { id: 7, name: 'Banana', price: 9.9, unit: '1kg', image: squarePlaceholder, sales: 3456 },
  { id: 8, name: 'Fresh Milk', price: 12.8, unit: '1L', image: squarePlaceholder, sales: 5621 },
  { id: 9, name: 'Broccoli', price: 6.5, unit: '1pc', image: squarePlaceholder, sales: 1234 },
  { id: 10, name: 'Chicken Breast', price: 22.0, unit: '500g', image: squarePlaceholder, sales: 2156 },
]

export const videos = [
  { id: 1, title: 'Tomato Egg Recipe', cover: videoPlaceholder, views: 12580, likes: 2341, duration: '03:45', isNew: true },
  { id: 2, title: 'Steamed Fish', cover: videoPlaceholder, views: 8923, likes: 1876, duration: '04:20', isNew: true },
  { id: 3, title: 'Braised Pork', cover: videoPlaceholder, views: 23456, likes: 4521, duration: '05:30', isNew: true },
  { id: 4, title: 'Garlic Broccoli', cover: videoPlaceholder, views: 6789, likes: 1234, duration: '02:15', isNew: false },
  { id: 5, title: 'Cucumber Salad', cover: videoPlaceholder, views: 5432, likes: 987, duration: '01:45', isNew: false },
  { id: 6, title: 'Sour Fish Soup', cover: videoPlaceholder, views: 18901, likes: 3421, duration: '06:10', isNew: false },
]

export const addresses = [
  { id: 1, name: 'Zhang', phone: '138****8888', address: 'Address 1', isDefault: true },
  { id: 2, name: 'Li', phone: '139****9999', address: 'Address 2', isDefault: false },
]

export const orderStatusMap = {
  pending: 'Pending',
  delivering: 'Delivering',
  completed: 'Completed',
}
