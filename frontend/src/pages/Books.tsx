import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookApi } from '@/services/api';
import { Book, Category, PaginatedResponse } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';

const Books = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginatedResponse<Book>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
    totalPages: 0
  });

  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    categoryId: searchParams.get('categoryId') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'created_at',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await bookApi.getCategories();
        if (response.data.success && response.data.data) {
          setCategories(response.data.data.flat || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params: any = {
          page: pagination.page,
          pageSize: pagination.pageSize,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        };

        if (filters.keyword) params.keyword = filters.keyword;
        if (filters.categoryId) params.categoryId = filters.categoryId;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;

        const response = await bookApi.getBooks(params);
        if (response.data.success && response.data.data) {
          setPagination(response.data.data);
          setBooks(response.data.data.items);
        }
      } catch (error) {
        console.error('Failed to fetch books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [filters, pagination.page, pagination.pageSize]);

  const handleSearch = () => {
    setSearchParams({
      keyword: filters.keyword,
      categoryId: filters.categoryId,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = async (book: Book) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const success = await addToCart(book.id, 1);
    if (success) {
      alert('已添加到购物车');
    } else {
      alert('添加失败，请重试');
    }
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div className="container section">
      <h1 className="section-title">图书列表</h1>

      <div className="filter-panel">
        <div className="filter-row">
          <div className="filter-item">
            <label className="filter-label">搜索：</label>
            <input
              type="text"
              name="keyword"
              className="form-input"
              style={{ width: '200px' }}
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="书名/作者/出版社"
            />
          </div>

          <div className="filter-item">
            <label className="filter-label">分类：</label>
            <select
              name="categoryId"
              className="form-select"
              style={{ width: '150px' }}
              value={filters.categoryId}
              onChange={handleFilterChange}
            >
              <option value="">全部分类</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">价格：</label>
            <input
              type="number"
              name="minPrice"
              className="form-input"
              style={{ width: '80px' }}
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="最低"
            />
            <span>-</span>
            <input
              type="number"
              name="maxPrice"
              className="form-input"
              style={{ width: '80px' }}
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="最高"
            />
          </div>
        </div>

        <div className="filter-row" style={{ marginTop: '1rem' }}>
          <div className="filter-item">
            <label className="filter-label">排序：</label>
            <select
              name="sortBy"
              className="form-select"
              style={{ width: '120px' }}
              value={filters.sortBy}
              onChange={handleFilterChange}
            >
              <option value="created_at">上架时间</option>
              <option value="price">价格</option>
              <option value="sales_count">销量</option>
              <option value="title">书名</option>
            </select>
            <select
              name="sortOrder"
              className="form-select"
              style={{ width: '80px' }}
              value={filters.sortOrder}
              onChange={handleFilterChange}
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleSearch}>
            搜索
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {books.length > 0 ? (
            <>
              <div className="grid grid-4">
                {books.map((book) => (
                  <div key={book.id} className="card book-card">
                    <div 
                      className="book-cover"
                      onClick={() => navigate(`/books/${book.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: '3rem' }}>📖</span>
                    </div>
                    <div className="book-card-content">
                      <h3 
                        className="book-title"
                        onClick={() => navigate(`/books/${book.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {book.title}
                        {book.is_new && <span className="new-badge">新书</span>}
                      </h3>
                      <p className="book-author">{book.author}</p>
                      <p className="book-publisher">{book.publisher}</p>
                      <div className="book-price">
                        <span className="price-current">¥{book.actual_price.toFixed(2)}</span>
                        {book.discount_price && (
                          <span className="price-original">¥{book.price.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => handleAddToCart(book)}
                        >
                          加入购物车
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/books/${book.id}`)}
                        >
                          详情
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination mt-8">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    上一页
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                    .map((p, index, arr) => (
                      <React.Fragment key={p}>
                        {index > 0 && arr[index - 1] !== p - 1 && (
                          <span style={{ padding: '0 0.5rem' }}>...</span>
                        )}
                        <button
                          className={p === pagination.page ? 'active' : ''}
                          onClick={() => handlePageChange(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <p className="empty-state-text">暂无符合条件的图书</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Books;
