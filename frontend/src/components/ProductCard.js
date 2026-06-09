import React from 'react';
import { FaPenToSquare, FaTrash, FaImages } from 'react-icons/fa6';
import { resolveImageUrl, extractPrimaryImage, PLACEHOLDER_IMAGE } from '../utils/helpers';

const ProductCard = ({
  product,
  onEdit,
  onDelete,
  loading = false
}) => {
  const imageUrl = resolveImageUrl(extractPrimaryImage(product), PLACEHOLDER_IMAGE);
  const imageCount = product.images?.length || 0;
  const hasDescription = product.description && product.description.trim().length > 0;
  const hasRating = product.rating && product.rating > 0;
  const reviewCount = product.totalRatings || 0;
  const stockValue = product.stock != null
    ? parseInt(String(product.stock).replace(/^0+(?=\d)/, ''), 10)
    : NaN;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 group overflow-hidden border border-blue-100 hover:border-blue-300 flex flex-col h-full">
      {/* Image Container - Dynamic and Responsive */}
      <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-blue-100 to-blue-50 overflow-hidden flex-shrink-0">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
        />

        {/* Image Badge */}
        {imageCount > 0 && (
          <div className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <FaImages size={12} /> {imageCount}
          </div>
        )}

        {/* Out of Stock Badge */}
        {stockValue === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
            <p className="text-white font-bold text-lg">OUT OF STOCK</p>
          </div>
        )}
      </div>

      {/* Content - Grows with content */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        {/* Product Name */}
        <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-2 hover:text-blue-600 transition line-clamp-2">
          {product.name}
        </h3>

        {/* Category & Price Section */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-blue-100">
          <span className="text-xs sm:text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-full font-semibold">
            {product.category?.replace(/_/g, ' ').toUpperCase()}
          </span>
          <span className="text-lg sm:text-xl font-bold text-blue-600">
            KES {Number(product.price).toLocaleString()}
          </span>
        </div>

        {/* Rating Section - Only show if exists */}
        {hasRating && (
          <div className="flex items-center gap-2 mb-3 bg-blue-50 px-3 py-2 rounded-lg">
            <div className="flex text-blue-500">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.round(product.rating) ? 'text-yellow-400' : 'text-blue-300'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs font-semibold text-blue-700">
              {product.rating.toFixed(1)} 
              {reviewCount > 0 && ` (${reviewCount})`}
            </span>
          </div>
        )}

        {/* Description - Only show if exists and not empty */}
        {hasDescription && (
          <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2 flex-grow">
            {product.description}
          </p>
        )}

        {/* Stock Info - Professional */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 mb-4 border border-blue-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-blue-700">Stock</span>
            <span className={`text-sm font-bold ${stockValue > 5 ? 'text-green-600' : stockValue > 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {stockValue > 0
                ? `${stockValue} ${stockValue === 1 ? 'unit' : 'units'}`
                : 'Out of stock'}
            </span>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            {stockValue > 5
              ? 'Plenty available'
              : stockValue > 0
                ? 'Low stock, sell quickly'
                : 'This item is currently unavailable'}
          </p>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden shadow-sm">
            <div
              className={`h-full transition-all duration-500 ${stockValue > 5 ? 'bg-gradient-to-r from-green-400 to-green-600' : stockValue > 0 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
              style={{ width: `${Math.min((Math.max(stockValue, 0) / (Math.max(stockValue, 0) + 10)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Actions - Stick to bottom */}
        <div className="flex gap-2 pt-3 mt-auto">
          <button
            onClick={() => onEdit(product)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2.5 px-3 rounded-lg transition duration-200 text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            aria-label="Edit product"
          >
            <FaPenToSquare size={14} />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            onClick={() => onDelete(product.id)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-2.5 px-3 rounded-lg transition duration-200 text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:scale-105"
            aria-label="Delete product"
          >
            <FaTrash size={14} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
