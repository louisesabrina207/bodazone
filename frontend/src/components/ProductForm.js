import React, { useState, useEffect } from 'react';
import { FaX } from 'react-icons/fa6';
import ImageUploadArea from './ImageUploadArea';

const ProductForm = ({
  product = null,
  isEditing = false,
  onSubmit,
  onCancel,
  loading = false,
  categories = []
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'accessories',
    description: '',
    price: '',
    deliveryFee: 0,
    stock: 0,
    reorderLevel: 5,
    compatibility: []
  });

  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const formatCategoryLabel = (value) =>
    String(value)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

  const categoryOptions = (Array.isArray(categories) ? categories : [])
    .map((cat) => {
      if (typeof cat === 'string') {
        return {
          value: cat,
          label: formatCategoryLabel(cat)
        };
      }

      if (cat && typeof cat === 'object') {
        const value = cat.name || cat.value || '';
        if (!value) return null;

        return {
          value,
          label: cat.displayName || cat.label || formatCategoryLabel(value)
        };
      }

      return null;
    })
    .filter((cat) => cat && cat.value);

  useEffect(() => {
    if (product && isEditing) {
      setFormData({
        name: product.name || '',
        category: product.category || 'accessories',
        description: product.description || '',
        price: product.price || '',
        deliveryFee: product.deliveryFee || 0,
        stock: product.stock || 0,
        reorderLevel: product.reorderLevel || 5,
        compatibility: product.compatibility || []
      });
      setImages(product.images || []);
      setImageFiles([]);
    }
  }, [product, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'deliveryFee', 'stock', 'reorderLevel'].includes(name) ? Number(value) : value
    }));
  };

  const handleImagesReady = (payload) => {
    if (Array.isArray(payload)) {
      setImages(payload);
      setImageFiles([]);
      setUploadingImages(false);
      return;
    }

    const nextImages = Array.isArray(payload?.images) ? payload.images : [];
    const nextFiles = Array.isArray(payload?.files) ? payload.files : [];

    setImages(nextImages);
    setImageFiles(nextFiles);
    setUploadingImages(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      images,
      imageFiles
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isEditing ? 'Edit Product' : 'Create New Product'}
          </h2>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition"
            aria-label="Close form"
          >
            <FaX size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Motorcycle Tire 17 inch"
              className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
              required
            >
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed product description..."
              className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
              rows="4"
              required
            />
          </div>

          {/* Price and Stock Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (KES) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Fee Per Item (KES, optional)
              </label>
              <input
                type="number"
                name="deliveryFee"
                value={formData.deliveryFee}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-1">Set by the shop owner. Leave blank for zero delivery fee.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                required
              />
            </div>
          </div>

          {/* Reorder Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reorder Level
            </label>
            <input
              type="number"
              name="reorderLevel"
              value={formData.reorderLevel}
              onChange={handleChange}
              min="0"
              placeholder="5"
              className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Images <span className="text-gray-500 text-xs">(up to 5 images)</span>
            </label>
            <ImageUploadArea
              images={images}
              onImagesReady={handleImagesReady}
              productId={product?.id}
              isEditing={isEditing}
              onUploadingChange={setUploadingImages}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
