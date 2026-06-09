import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, reviewAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { resolveImageUrl, extractPrimaryImage } from '../utils/helpers';
import { FaStar, FaShoppingCart, FaArrowLeft, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { success: showSuccess, error: showError } = useNotification();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityControls, setShowQuantityControls] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchProductDetails = useCallback(async () => {
    try {
      const response = await productAPI.getProductById(id);
      setProduct(response.data?.data || response.data?.product || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchProductReviews = useCallback(async () => {
    try {
      const response = await reviewAPI.getProductReviews(id);
      const list = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.reviews)
          ? response.data.reviews
          : [];
      setReviews(list);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchProductDetails();
    fetchProductReviews();
  }, [fetchProductDetails, fetchProductReviews]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      showError('Please login to add items to cart');
      navigate('/login');
      return;
    }

    addToCart(product, quantity);
    showSuccess(`${product.name} added to cart!`);
    setShowQuantityControls(false);
    setQuantity(1);
  };

  const handleOpenQuantityControls = () => {
    if (!isAuthenticated) {
      showError('Please login to add items to cart');
      navigate('/login');
      return;
    }

    setShowQuantityControls(true);
  };

  const handleCancelQuantityControls = () => {
    setShowQuantityControls(false);
    setQuantity(1);
  };

  const getProductImages = () => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images;
    }

    if (typeof product?.images === 'string') {
      try {
        const parsedImages = JSON.parse(product.images);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          return parsedImages;
        }
      } catch {
        // fall through to the primary image
      }
    }

    const primaryImage = extractPrimaryImage(product);
    return primaryImage ? [primaryImage] : [];
  };

  const images = getProductImages();
  const currentImage = images[currentImageIndex] || product?.image;
  const stockValue = product?.stock != null
    ? parseInt(String(product.stock).replace(/^0+(?=\d)/, ''), 10)
    : NaN;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-sky-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-sky-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6 transition"
          >
            <FaArrowLeft /> Back to Products
          </button>
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-lg font-semibold">
            {error || 'Product not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-6 transition"
        >
          <FaArrowLeft /> Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Image Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-4">
              {currentImage ? (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={resolveImageUrl(currentImage)} 
                    alt={product.name}
                    className="w-full h-64 object-contain rounded-lg"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <FaChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <FaChevronRight size={20} />
                      </button>
                      <p className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1}/{images.length}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-96 bg-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No Image Available</span>
                </div>
              )}
              
              {/* Image Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <img 
                      key={idx}
                      src={resolveImageUrl(img)} 
                      alt={`Product ${idx + 1}`}
                      className={`w-16 h-16 object-cover rounded cursor-pointer border-2 transition ${
                        idx === currentImageIndex ? 'border-blue-500 shadow-md' : 'border-gray-300 hover:border-blue-300'
                      }`}
                      onClick={() => setCurrentImageIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Details Sidebar */}
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border-l-4 border-blue-600">
              <h1 className="text-2xl font-bold text-gray-800 mb-3">{product.name}</h1>
              
              {/* Category and Rating */}
              <div className="mb-4 pb-4 border-b-2 border-blue-200">
                <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-3">
                  {product.category?.replace('_', ' ').toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i}
                        className={i < Math.round(product.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}
                        size={16}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-700 text-sm">({product.rating || 'N/A'} / 5)</span>
                </div>
              </div>

              {/* Price - Highlighted */}
              <div className="mb-4 pb-4 border-b-2 border-blue-200 bg-white rounded p-3">
                <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1">Price</p>
                <p className="text-3xl font-bold text-blue-600">KES {parseFloat(product.price).toLocaleString()}</p>
              </div>

              {/* Stock Status */}
              <div className="mb-4 pb-4 border-b-2 border-blue-200">
                {stockValue > 0 ? (
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    ✓ In Stock ({stockValue} available)
                  </span>
                ) : (
                  <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Seller Info */}
              <div className="mb-4 pb-4 border-b-2 border-blue-200">
                <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">Sold by</p>
                <div>
                  <p className="font-bold text-gray-800">{product.Seller?.shopName || 'BodaZone Shop'}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <FaStar size={12} className="text-yellow-500" />
                    Rating: {product.Seller?.rating ?? product.rating ?? 'N/A'}
                  </p>
                </div>
              </div>

              {!showQuantityControls ? (
                <button
                  onClick={handleOpenQuantityControls}
                  disabled={product.stock <= 0}
                  className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 text-lg ${
                    product.stock <= 0
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  <FaShoppingCart /> Add to Cart
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white rounded p-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Quantity</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 border-2 border-blue-300 rounded-lg hover:bg-blue-50 font-bold text-blue-600"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => {
                          const parsed = parseInt(e.target.value, 10) || 1;
                          setQuantity(Math.min(product.stock, Math.max(1, parsed)));
                        }}
                        className="flex-1 text-center border-2 border-blue-300 rounded-lg px-2 py-2 font-bold focus:border-blue-600 focus:outline-none"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="w-10 h-10 border-2 border-blue-300 rounded-lg hover:bg-blue-50 font-bold text-blue-600"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 text-lg bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-lg hover:scale-105"
                    >
                      <FaShoppingCart /> Confirm
                    </button>
                    <button
                      onClick={handleCancelQuantityControls}
                      className="px-4 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 text-lg bg-gray-300 text-gray-700 hover:bg-gray-400"
                      aria-label="Cancel add to cart"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description and Reviews */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Description */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-700"></div>
              Product Details
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{product.description || 'No description available'}</p>
          </div>

          {/* Reviews Summary */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg shadow-md p-6 h-fit border-l-4 border-yellow-500">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Rating Summary</h2>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-yellow-500">{product.rating || 'N/A'}</p>
              <div className="flex justify-center gap-1 my-3">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={i < Math.round(product.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}
                    size={18}
                  />
                ))}
              </div>
              <p className="text-gray-600 text-sm font-semibold">{reviews.length} customer reviews</p>
              <p className="text-gray-600 text-sm font-semibold mt-1">{product.sold || 0} sold</p>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-600">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-blue-700"></div>
            Customer Reviews
          </h2>
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-sky-50 rounded-lg">
              <p className="text-gray-600 text-lg">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="border-l-4 border-blue-300 pl-4 pb-6 last:border-b-0 hover:bg-sky-50 p-4 rounded transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-800">{review.User?.name || review.reviewerName || 'Anonymous Customer'}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i}
                            className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                            size={14}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-bold text-gray-700 mt-1 bg-blue-100 text-blue-700 px-2 py-1 rounded">{review.rating}/5</p>
                    </div>
                  </div>
                  {review.title && (
                    <p className="font-semibold text-gray-800 mb-2">{review.title}</p>
                  )}
                  <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                  
                  {/* Additional review details if available */}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600 pt-3 border-t border-gray-200">
                    {review.quality && <span className="bg-blue-50 px-2 py-1 rounded">Quality: {review.quality}/5</span>}
                    {review.deliverySpeed && <span className="bg-blue-50 px-2 py-1 rounded">Delivery: {review.deliverySpeed}/5</span>}
                    {review.sellerService && <span className="bg-blue-50 px-2 py-1 rounded">Service: {review.sellerService}/5</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
