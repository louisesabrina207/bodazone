import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaMotorcycle, FaTruck, FaStar, FaShoppingCart, FaFolder, FaSearch, FaShoppingBag } from 'react-icons/fa';
import { productAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { resolveImageUrl, extractPrimaryImage } from '../utils/helpers';

const HomePage = () => {
  const { error: showError } = useNotification();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const ITEMS_PER_PAGE = 30;

  const fetchCategories = useCallback(async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      showError('Failed to load categories');
      console.error(err);
    }
  }, [showError]);

  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const response = await productAPI.getAllProducts({
        category: selectedCategory || undefined,
        search: search || undefined,
        page: pageNum,
        limit: ITEMS_PER_PAGE
      });

      const productRows = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.products)
          ? response.data.products
          : [];

      const total = response.data?.total || productRows.length;
      setTotalProducts(total);

      if (append) {
        setProducts(prev => [...prev, ...productRows]);
      } else {
        setProducts(productRows);
      }

      setHasMore(productRows.length === ITEMS_PER_PAGE);
    } catch (err) {
      showError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showError, selectedCategory, search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [selectedCategory, search, fetchProducts]);

  const handleLoadMore = () => {
    if(!hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  return (
    <div className="bg-sky-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4 text-yellow-400">BodaZone</h1>
              <p className="text-xl mb-2 text-blue-50">Quality Motorbike Spare Parts at Your Fingertips</p>
              <p className="text-lg mb-6 opacity-95 text-blue-100">Connect with trusted sellers and get genuine spare parts delivered to your location</p>
              <div className="flex gap-4">
                <a 
                  href="#products" 
                  className="bg-yellow-400 text-blue-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition"
                >
                  Browse Products
                </a>
                <Link 
                  to="/register?role=seller" 
                  className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition"
                >
                  Become a Seller
                </Link>
              </div>
            </div>
            <div className="text-center">
              <FaMotorcycle className="text-7xl mx-auto opacity-20 text-blue-200" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Condensed */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50 border-b-2 border-blue-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-blue-400 transition">
              <FaShoppingCart className="text-4xl text-blue-600 mx-auto mb-3 drop-shadow-lg" />
              <h3 className="font-bold mb-1 text-gray-800 text-lg">Wide Selection</h3>
              <p className="text-sm text-gray-600">Thousands of genuine spare parts</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-blue-400 transition">
              <FaTruck className="text-4xl text-green-600 mx-auto mb-3 drop-shadow-lg" />
              <h3 className="font-bold mb-1 text-gray-800 text-lg">Fast Delivery</h3>
              <p className="text-sm text-gray-600">Real-time tracking & delivery</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-blue-400 transition">
              <FaStar className="text-4xl text-blue-500 mx-auto mb-3 drop-shadow-lg" />
              <h3 className="font-bold mb-1 text-gray-800 text-lg">Quality Assured</h3>
              <p className="text-sm text-gray-600">Verified seller ratings</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:border-blue-400 transition">
              <FaShoppingBag className="text-4xl text-blue-700 mx-auto mb-3 drop-shadow-lg" />
              <h3 className="font-bold mb-1 text-gray-800 text-lg">Easy Checkout</h3>
              <p className="text-sm text-gray-600">Secure M-Pesa payments</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Discovery Section */}
      <section id="products" className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800 mb-2 text-center">Discover Products</h2>
          <p className="text-center text-gray-600 mb-8">Browse our wide range of motorbike spare parts</p>

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
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 h-fit sticky top-20 border-l-4 border-blue-600">
              <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2 pb-3 border-b-2 border-blue-300">
                <FaFolder className="text-blue-600" />
                Categories
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition transform hover:scale-105 ${
                    selectedCategory === null
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'hover:bg-blue-200 text-gray-700 border-l-2 border-transparent hover:border-blue-600'
                  }`}
                >
                  All Products
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition transform hover:scale-105 flex justify-between items-center ${
                      selectedCategory === cat.name
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'hover:bg-blue-200 text-gray-700 border-l-2 border-transparent hover:border-blue-600'
                    }`}
                  >
                    <span>{cat.displayName}</span>
                    <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full ${selectedCategory === cat.name ? 'bg-blue-400 text-white' : 'bg-blue-200 text-blue-800'}`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              <div className="mb-8 pb-4 border-b-2 border-blue-200">
                <h3 className="text-3xl font-bold text-gray-800">
                  {selectedCategory ? (
                    <>
                      {categories.find(c => c.name === selectedCategory)?.displayName} Products
                    </>
                  ) : (
                    'All Products'
                  )}
                </h3>
                <p className="text-blue-600 font-semibold mt-2">Showing {totalProducts} items</p>
              </div>

              {loading && page === 1 ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-b-4 border-blue-600"></div>
                  <p className="mt-6 text-gray-600 font-semibold text-lg">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-16 text-center border-2 border-blue-200">
                  <FaShoppingBag className="text-blue-200 text-5xl mx-auto mb-4" />
                  <p className="text-gray-700 text-lg font-bold">No products found</p>
                  <p className="text-blue-600 text-sm mt-3">Try adjusting your search or selecting a different category</p>
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
                          className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 group border border-blue-100 hover:border-blue-400 transform hover:scale-105 flex flex-col h-full"
                        >
                          {/* Image Container - Bigger and Responsive */}
                          <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden flex items-center justify-center flex-shrink-0">
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
                          <div className="p-4 border-t-2 border-blue-100 flex flex-col flex-grow">
                            <h3 className="font-bold text-gray-800 mb-1 text-sm line-clamp-2">{product.name}</h3>
                            <p className="text-xs text-blue-600 font-semibold mb-3">
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
                                <p className="text-lg font-bold text-blue-600">
                                  KES {parseFloat(product.price).toLocaleString()}
                                </p>
                              </div>

                              {/* Stock Status */}
                            {stockValue <= 0 && (
                              <p className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1.5 rounded text-center">Out of Stock</p>
                            )}
                            {stockValue > 0 && stockValue <= 5 && (
                              <p className="text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1.5 rounded text-center">Only {stockValue} left!</p>
                            )}
                          </div>
                        </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center mb-8">
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:bg-blue-300 text-white font-bold py-3 px-10 rounded-lg transition transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        {loading ? 'Loading...' : 'Load More Products'}
                      </button>
                    </div>
                  )}

                  {!hasMore && products.length > 0 && (
                    <div className="text-center py-8 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <p className="text-blue-700 font-semibold">✓ You've reached the end of products</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-10 text-blue-100">Join thousands of motorbike riders and sellers in Kenya</p>
          <div className="flex gap-4 justify-center">
            <Link 
              to="/login" 
              className="bg-yellow-400 text-blue-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition"
            >
              Register Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
