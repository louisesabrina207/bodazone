import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaShoppingCart, FaStar, FaSearch, FaPlus, FaMinus, FaCheck, FaTimes } from 'react-icons/fa';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { resolveImageUrl, extractPrimaryImage, PLACEHOLDER_IMAGE } from '../utils/helpers';

const ProductsPage = () => {
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [hasMore, setHasMore] = useState(true);
  const sellerId = searchParams.get('seller');

  const categories = [
    'tires',
    'brakes',
    'engines',
    'batteries',
    'lights',
    'suspension',
    'exhaust',
    'chain',
    'sprockets',
    'clutch',
    'oil',
    'filters',
    'spark_plugs',
    'mirrors',
    'seats',
    'helmets',
    'accessories'
  ];

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        search: search || undefined,
        category: category || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sellerId: sellerId || undefined,
        page,
        limit: 30
      };

      const response = await productAPI.getAllProducts(params);
      const productRows = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.products)
          ? response.data.products
          : [];

      setProducts(productRows);
      setHasMore(productRows.length >= 30);  // If we got 30 or more, there might be more pages
      setError(null);
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, minPrice, maxPrice, page, sellerId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Start quantity selection for a product
  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    setQuantities(prev => ({
      ...prev,
      [productId]: quantities[productId] || 1
    }));
  };

  // Confirm and add to cart
  const handleConfirmAddToCart = (product) => {
    const quantity = quantities[product.id] || 1;
    addToCart(product, quantity);
    // Reset the selection
    setSelectedProductId(null);
    setQuantities(prev => ({
      ...prev,
      [product.id]: 1
    }));
  };

  // Cancel quantity selection
  const handleCancelSelection = () => {
    setSelectedProductId(null);
  };

  // Update quantity
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity >= 1) {
      setQuantities(prev => ({
        ...prev,
        [productId]: newQuantity
      }));
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pb-4 border-b-2 border-blue-200">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Motorbike Spare Parts</h1>
            <p className="text-blue-600 font-semibold">
              {sellerId ? 'Showing products from a selected shop.' : 'Browse the full marketplace and filter by what you need.'}
            </p>
          </div>
          {sellerId && (
            <Link
              to="/shops"
              className="inline-flex items-center justify-center rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 hover:border-blue-400 hover:shadow-lg transition"
            >
              Back to shops
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-md p-6 mb-8 border border-blue-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-300">Filter Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Search</label>
              <div className="flex items-center border-2 border-blue-300 rounded-lg px-3 py-2.5 focus-within:border-blue-600 focus-within:bg-blue-50 transition">
                <FaSearch className="text-blue-500 mr-2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search products..."
                  className="flex-1 outline-none bg-transparent text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full border-2 border-blue-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-600 focus:bg-blue-50 transition bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Min Price</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="Minimum price"
                className="w-full border-2 border-blue-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-600 focus:bg-blue-50 transition"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Max Price</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="Maximum price"
                className="w-full border-2 border-blue-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-600 focus:bg-blue-50 transition"
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-b-4 border-blue-600"></div>
            <p className="text-blue-600 font-semibold text-lg mt-6">Loading products...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-lg border-2 border-red-200">
            <p className="text-red-600 text-lg font-bold">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
            <p className="text-blue-700 text-lg font-bold">No products found</p>
            <p className="text-blue-600 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {products.map((product) => {
                const hasDescription = product.description && product.description.trim().length > 0;
                const hasRating = product.totalRatings && product.totalRatings > 0;
                const stockValue = product.stock !== undefined && product.stock !== null && String(product.stock).trim() !== ''
                  ? Number(String(product.stock).trim())
                  : NaN;
                const stockText = Number.isFinite(stockValue)
                  ? stockValue > 0
                    ? `${stockValue} ${stockValue === 1 ? 'unit' : 'units'} available`
                    : 'Out of stock'
                  : 'Stock unavailable';
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 group border border-blue-100 hover:border-blue-400 overflow-hidden transform hover:scale-105 flex flex-col h-full">
                    {/* Image Container - Bigger and Mobile Responsive */}
                    <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden flex-shrink-0">
                      <img
                        src={resolveImageUrl(extractPrimaryImage(product), PLACEHOLDER_IMAGE)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />
                    </div>

                    {/* Content - Grows with content */}
                    <div className="p-4 border-t-2 border-blue-100 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>

                      {/* <p className="text-blue-600 text-sm font-semibold mb-3 bg-blue-50 inline-block px-2 py-1 rounded">{(product.category || 'other').replace('_', ' ').toUpperCase()}</p> */}

                      {/* Description - Only show if present */}
                      {hasDescription && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-3 flex-grow leading-relaxed">
                          {product.description}
                        </p>
                      )}

                      {/* Rating - Only show if present */}
                      {hasRating && (
                        <div className="flex items-center mb-3 bg-blue-50 px-2 py-1.5 rounded-lg w-fit">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} size={14} />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-blue-700 font-semibold">Rating: {product.totalRatings}</span>
                        </div>
                      )}

                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xs font-semibold ${Number.isFinite(stockValue)
                              ? stockValue > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                              : 'text-gray-500'}`}>
                            {stockText}
                          </p>
                          <span className="text-2xl font-bold text-blue-600">KES {Number(product.price || 0).toLocaleString()}</span>
                        </div>
                        {selectedProductId === product.id ? (
                          // Quantity controls view
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(product.id, quantities[product.id] - 1)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition"
                              disabled={quantities[product.id] <= 1}
                            >
                              <FaMinus size={14} />
                            </button>
                            <span className="w-10 text-center font-bold text-gray-800">
                              {quantities[product.id] || 1}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(product.id, quantities[product.id] + 1)}
                              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition"
                            >
                              <FaPlus size={14} />
                            </button>
                          </div>
                        ) : (
                          // Add to cart button
                          <button
                            onClick={() => handleSelectProduct(product.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition"
                            title="Click to set quantity"
                          >
                            <FaShoppingCart />
                          </button>
                        )}
                      </div>

                      <Link
                        to={`/product/${product.id}`}
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded font-semibold mt-3 transition transform hover:scale-105"
                      >
                        View Details
                      </Link>

                      {/* Confirm/Cancel buttons when quantity is selected */}
                      {selectedProductId === product.id && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleConfirmAddToCart(product)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded flex items-center justify-center gap-2 transition font-semibold"
                          >
                            <FaCheck size={14} /> Add
                          </button>
                          <button
                            onClick={handleCancelSelection}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded flex items-center justify-center gap-2 transition font-semibold"
                          >
                            <FaTimes size={14} /> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex justify-center space-x-4 mt-12 mb-8">
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-lg font-semibold transition transform hover:scale-105"
                >
                  Previous
                </button>
              )}
              <span className="px-4 py-2.5 font-semibold text-blue-600 bg-blue-100 rounded-lg">Page {page}</span>
              {hasMore && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-lg font-semibold transition transform hover:scale-105"
                >
                  Next
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
