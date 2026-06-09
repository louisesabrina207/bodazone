import React, { useState, useRef } from 'react';
import { FaCloudArrowUp, FaX, FaCircleCheck } from 'react-icons/fa6';
import { productAPI } from '../services/api';
import { resolveImageUrl, PLACEHOLDER_IMAGE } from '../utils/helpers';

const ImageUploadArea = ({
  images = [],
  onImagesReady,
  productId,
  isEditing = false,
  onUploadingChange
}) => {
  const [previewImages, setPreviewImages] = useState(images);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check total images
    if (previewImages.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    const previews = await Promise.all(
      validFiles.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve({
                url: event.target.result,
                name: file.name,
                isLocal: true,
                file
              });
            };
            reader.readAsDataURL(file);
          })
      )
    );

    setPreviewImages((prev) => {
      const next = [...prev, ...previews];

      if (!isEditing || !productId) {
        onImagesReady({
          images: next.map((img) => img.url || img),
          files: next.filter((img) => img.isLocal && img.file).map((img) => img.file)
        });
      }

      return next;
    });
  };

  const handleUpload = async () => {
    const filesToUpload = previewImages.filter(img => img.isLocal && img.file);
    
    if (filesToUpload.length === 0) {
      onImagesReady({
        images: previewImages.map(img => img.url || img),
        files: []
      });
      return;
    }

    if (!isEditing || !productId) {
      onImagesReady({
        images: previewImages.map(img => img.url || img),
        files: filesToUpload.map(img => img.file).filter(Boolean)
      });
      return;
    }

    try {
      setUploading(true);
      onUploadingChange(true);

      const formData = new FormData();
      filesToUpload.forEach((img, idx) => {
        if (img.file) {
          formData.append('images', img.file);
          setUploadProgress(prev => ({ ...prev, [idx]: 0 }));
        }
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (updated[key] < 90) {
              updated[key] += Math.random() * 30;
            }
          });
          return updated;
        });
      }, 200);

      const response = await productAPI.uploadProductImages(productId, formData);
      clearInterval(progressInterval);

      // Mark all as uploaded
      setUploadProgress(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = 100;
        });
        return updated;
      });

      if (response.data?.success) {
        const uploadedImages = response.data?.data?.images || [];
        setPreviewImages(uploadedImages.map(url => ({ url, isLocal: false })));
        onImagesReady({ images: uploadedImages, files: [] });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
      onUploadingChange(false);
      setUploadProgress({});
    }
  };

  const removeImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('bg-yellow-50', 'border-yellow-500');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('bg-yellow-50', 'border-yellow-500');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('bg-yellow-50', 'border-yellow-500');

    const files = e.dataTransfer.files;
    fileInputRef.current.files = files;
    handleFileSelect({ target: { files } });
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <div onClick={() => !uploading && fileInputRef.current?.click()}>
          <FaCloudArrowUp className="mx-auto text-4xl text-yellow-500 mb-3" />
          <p className="text-lg font-semibold text-gray-700 mb-1">
            Drop images here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supported formats: JPEG, PNG, GIF, WebP (Max 5MB each, up to 5 images)
          </p>
        </div>
      </div>

      {/* Image Previews Grid */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previewImages.map((img, idx) => (
            <div key={idx} className="relative group">
              {/* Image Container */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-md">
                <img
                  src={resolveImageUrl(img.url || img, PLACEHOLDER_IMAGE)}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Progress Overlay for Uploading Images */}
              {uploadProgress[idx] !== undefined && uploadProgress[idx] < 100 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin mb-2 mx-auto"></div>
                    <p className="text-white text-xs font-semibold">
                      {Math.round(uploadProgress[idx])}%
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Complete Check */}
              {uploadProgress[idx] === 100 && (
                <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                  <FaCircleCheck className="text-white" size={16} />
                </div>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                disabled={uploading}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                aria-label="Remove image"
              >
                <FaX size={12} />
              </button>

              {/* Primary Badge */}
              {idx === 0 && (
                <div className="absolute bottom-1 left-1 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Counter */}
      {previewImages.length > 0 && (
        <p className="text-sm text-gray-600 flex items-center justify-between">
          <span>{previewImages.length} of 5 images</span>
          {previewImages.length > 0 && (
            <span className="text-xs text-gray-500">
              {previewImages.filter(img => img.isLocal).length} ready to upload
            </span>
          )}
        </p>
      )}

      {/* Upload Button */}
      {isEditing && productId && previewImages.filter(img => img.isLocal).length > 0 && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
        >
          {uploading ? 'Uploading...' : 'Upload Images'}
        </button>
      )}
    </div>
  );
};

export default ImageUploadArea;
