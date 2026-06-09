import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { FaFolder, FaSearch, FaStar, FaShoppingBag } from 'react-icons/fa';
import { resolveImageUrl, extractPrimaryImage } from '../utils/helpers';

const DiscoverPage = () => {
  const { error: showError } = useNotification();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      showError('Failed to load categories');
      console.error(err);
    }
  };

  const fetchProductsByCategory = async (category) => {
    try {
      setLoading(true);
      const response = await productAPI.getAllProducts({
        category: category || undefined,
        search: search || undefined,
        page,
        limit: 12
      });
      const productRows = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.products)
          ? response.data.products
          : [];
      setProducts(productRows);
    } catch (err) {
      showError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProductsByCategory(selectedCategory);
    setPage(1);
  }, [selectedCategory, search]);

  useEffect(() => {
    fetchProductsByCategory(selectedCategory);
  }, [page]);

  return (
    <div className="min-h-screen bg-sky-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Discover Products</h1>
          <p className="text-blue-100">Browse our wide range of motorbike spare parts by category</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center border-2 border-blue-300 rounded-lg px-4 py-3">
            <FaSearch className="text-blue-500 mr-3" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products..."
              className="flex-1 outline-none text-gray-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-4 border-l-4 border-blue-600">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaFolder className="text-blue-600" />
              Categories
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-blue-50 text-gray-700'
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium transition flex justify-between items-center ${
                    selectedCategory === cat.name
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-blue-50 text-gray-700'
                  }`}
                >
                  <span>{cat.displayName}</span>
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedCategory ? (
                  <>
                    {categories.find(c => c.name === selectedCategory)?.displayName} Products
                  </>
                ) : (
                  'All Products'
                )}
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center border-t-4 border-blue-600">
                <FaShoppingBag className="text-blue-200 text-4xl mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No products found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your search or selecting a different category</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {products.map((product) => {
                    const hasDescription = product.description && product.description.trim().length > 0;
                    const hasRating = product.rating && product.rating > 0;
                    const stockValue = product.stock != null
                      ? parseInt(String(product.stock).replace(/^0+(?=\d)/, ''), 10)
                      : NaN;
                    const stockText = Number.isInteger(stockValue)
                      ? stockValue > 0
                        ? `${stockValue} ${stockValue === 1 ? 'unit' : 'units'} available`
                        : 'Out of stock'
                      : 'Stock unavailable';
                    return (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 group border border-blue-100 hover:border-blue-400 border-t-4 border-t-blue-500 transform hover:scale-105 flex flex-col h-full"
                      >
                        {/* Image Container - Bigger and Mobile Responsive */}
                        <div className="w-full h-48 sm:h-56 md:h-64 bg-blue-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {extractPrimaryImage(product) ? (
                            <img
                              src={resolveImageUrl(extractPrimaryImage(product))}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                            />
                          ) : (
                            <FaShoppingBag className="text-blue-300 text-5xl" />
                          )}
                        </div>

                        {/* Content - Grows with content */}
                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
                          <p className="text-sm text-blue-600 font-semibold mb-3">
                            {product.category?.replace(/_/g, ' ').toUpperCase()}
                          </p>

                          {/* Description - Only show if present */}
                          {hasDescription && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-3 flex-grow leading-relaxed">
                              {product.description}
                            </p>
                          )}

                          {/* Rating - Only show if present */}
                          {hasRating && (
                            <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1.5 rounded-lg mb-3 w-fit">
                              <span className="text-yellow-400">★</span>
                              <span className="text-xs font-bold text-blue-700">
                                {product.rating.toFixed(1)}
                                {product.totalRatings > 0 && ` (${product.totalRatings})`}
                              </span>
                            </div>
                          )}

                          {/* Price and Stock */}
                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-2">
                              <p className={`text-xs font-semibold ${stockValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stockText}
                              </p>
                              <p className="text-2xl font-bold text-blue-600">
                                KES {parseFloat(product.price).toLocaleString()}
                              </p>
                            </div>

                            {/* Stock Status */}
                          {stockValue <= 0 && (
                            <p className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1.5 rounded text-center mt-2">Out of Stock</p>
                          )}
                          {stockValue > 0 && stockValue <= 5 && (
                            <p className="text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1.5 rounded text-center mt-2">Only {stockValue} left!</p>
                          )}
                        </div>
                      </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {Math.ceil(products.length / 12) > 1 && (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 font-semibold transition"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 font-semibold text-blue-600 bg-blue-50 rounded-lg">Page {page}</span>
                    <button
                      onClick={() => setPage(page + 1)}
                      className="px-4 py-2 border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
