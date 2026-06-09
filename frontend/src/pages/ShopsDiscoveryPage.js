import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { FaStar, FaSearch, FaMapMarkerAlt, FaStore, FaTruck, FaShieldAlt, FaBoxOpen, FaChevronRight } from 'react-icons/fa';
import { resolveImageUrl, PLACEHOLDER_IMAGE } from '../utils/helpers';

const ShopsDiscoveryPage = () => {
  const navigate = useNavigate();
  const { error: showError } = useNotification();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('rating');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getAllShops({
        search: search || undefined,
        verificationStatus: selectedStatus !== 'all' ? selectedStatus : undefined,
        page,
        limit: 12
      });

      let shopsList = Array.isArray(response.data?.data) ? response.data.data : [];

      // Sort shops
      if (sortBy === 'rating') {
        shopsList = shopsList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortBy === 'products') {
        shopsList = shopsList.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
      } else if (sortBy === 'delivery') {
        shopsList = shopsList.sort((a, b) => (a.averageDeliveryTime || 999) - (b.averageDeliveryTime || 999));
      }

      setShops(shopsList);
    } catch (err) {
      showError('Failed to load shops');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
    setPage(1);
  }, [search, sortBy, selectedStatus]);

  useEffect(() => {
    fetchShops();
  }, [page]);

  const handleViewShop = (sellerId) => {
    navigate(`/products?seller=${sellerId}`);
  };

  const handleViewAllProducts = () => {
    navigate('/products');
  };

  return (
    <div className="min-h-screen bg-sky-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FaStore /> Discover Shops
          </h1>
          <p className="text-blue-100 max-w-3xl">
            Find trusted sellers, compare their ratings and product range, and jump straight into a shop’s inventory.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="flex items-center border-2 border-blue-300 rounded-lg px-4 py-3">
              <FaSearch className="text-blue-500 mr-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shops by name or location..."
                className="flex-1 outline-none text-gray-800"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600"
            >
              <option value="rating">Sort by: Highest Rated</option>
              <option value="products">Sort by: Most Products</option>
              <option value="delivery">Sort by: Fastest Delivery</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All shops</option>
              <option value="verified">Verified only</option>
              <option value="pending">Pending verification</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleViewAllProducts}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
            >
              Browse all products <FaChevronRight size={12} />
            </button>
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-blue-800 font-semibold">
              <FaShieldAlt /> Verified shops are highlighted for easier trust decisions
            </div>
          </div>
        </div>

        {/* Shops Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading shops...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaStore className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No shops found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition border border-blue-100"
                >
                  {/* Shop Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/20 flex items-center justify-center border border-white/20">
                        {shop.shopImage ? (
                          <img
                            src={resolveImageUrl(shop.shopImage, PLACEHOLDER_IMAGE)}
                            alt={shop.shopName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FaStore className="text-2xl text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-2xl font-bold truncate text-white\">{shop.shopName}</h3>
                          {shop.verificationStatus === 'verified' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-400 px-2 py-1 text-xs font-bold text-white">
                              <FaShieldAlt size={10} /> Verified
                            </span>
                          )}
                        </div>
                        <p className="text-blue-100 text-sm mt-1 line-clamp-2">
                          {shop.shopDescription || 'Quality spare parts seller'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shop Info */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-blue-50 p-3 border border-blue-200">
                        <div className="flex items-center gap-1 text-blue-600 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={i < Math.round(shop.rating || 0) ? 'text-blue-600' : 'text-blue-200'}
                              size={12}
                            />
                          ))}
                        </div>
                        <p className="text-lg font-bold text-gray-800">{(shop.rating || 0).toFixed(1)}</p>
                        <p className="text-xs text-gray-600">Shop rating</p>
                      </div>

                      <div className="rounded-xl bg-blue-50 p-3 border border-blue-200">
                        <FaBoxOpen className="text-blue-600 mb-1" />
                        <p className="text-lg font-bold text-gray-800">{shop.productCount || 0}</p>
                        <p className="text-xs text-gray-600">Products listed</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-gray-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
                      <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
                      <span className="text-sm">{shop.location || 'Nairobi'}</span>
                    </div>

                    {/* Owner and responsiveness */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
                      <div>
                        <p className="text-xs text-gray-600">Owner</p>
                        <p className="text-sm font-semibold text-gray-800">{shop.ownerName || 'N/A'}</p>
                        <p className="text-xs text-gray-500 truncate">{shop.ownerEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Responsiveness</p>
                        <p className="text-sm font-semibold text-gray-800 capitalize">{shop.responsiveness || 'medium'}</p>
                        <p className="text-xs text-gray-500">Response speed</p>
                      </div>
                    </div>

                    {/* Delivery Time */}
                    {shop.averageDeliveryTime ? (
                      <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-xl">
                        <FaTruck className="text-green-500" />
                        <span className="text-sm">~{shop.averageDeliveryTime} days delivery</span>
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewShop(shop.id)}
                        className="flex-1 bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 transition"
                      >
                        View Products
                      </button>
                      <button
                        onClick={() => navigate(`/products?seller=${shop.id}`)}
                        className="inline-flex items-center justify-center rounded-lg border border-yellow-200 bg-white px-4 py-3 font-semibold text-yellow-700 hover:bg-yellow-50"
                        aria-label={`Open ${shop.shopName} storefront`}
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {shops.length > 0 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-700">Page {page}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ShopsDiscoveryPage;
