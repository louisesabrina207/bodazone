import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { productAPI, sellerAPI } from '../services/api';
import apiClient from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { FaPlus, FaBox, FaCartShopping, FaGear, FaChartBar, FaFileArrowDown } from 'react-icons/fa6';
import ProductForm from '../components/ProductForm';
import ProductCard from '../components/ProductCard';

const SellerDashboardPage = () => {
  const { success: showSuccess, error: showError } = useNotification();

  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellerDocs, setSellerDocs] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [shopFormData, setShopFormData] = useState({});

  const shopStatus = shop?.seller?.verificationStatus || dashboard?.seller?.verificationStatus || 'pending';
  const isVerifiedShop = shopStatus === 'verified' && (shop?.seller?.isActive !== false) && (dashboard?.seller?.isActive !== false);

  // Fetch functions
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await sellerAPI.getDashboard();
      setDashboard(response.data?.data || null);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load seller dashboard');
    }
  }, [showError]);

  const fetchShop = useCallback(async () => {
    try {
      const response = await sellerAPI.getMyShop();
      setShop(response.data?.data || null);
      setShopFormData(response.data?.data?.seller || {});
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load shop profile');
    }
  }, [showError]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productAPI.getMyProducts();
      setProducts(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load products');
    }
  }, [showError]);

  const fetchMyDocuments = useCallback(async () => {
    try {
      const response = await sellerAPI.getMyDocuments();
      setSellerDocs(response.data?.data || []);
    } catch (err) {
      // don't fail the whole dashboard if docs unavailable
      console.debug('Failed to load seller documents', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load categories');
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await sellerAPI.getMyOrders();
      setOrders(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load seller orders');
    }
  }, [showError]);

  // Initialize
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDashboard(),
      fetchShop(),
      fetchCategories()
    ]).finally(() => setLoading(false));
  }, [fetchDashboard, fetchShop, fetchCategories]);

  useEffect(() => {
    fetchMyDocuments();
  }, [fetchMyDocuments]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  const stats = useMemo(() => dashboard?.stats || {
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0
  }, [dashboard]);

  // Handlers
  const handleCreateProduct = () => {
    if (!isVerifiedShop) {
      showError('Your shop must be verified before you can create products');
      return;
    }

    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleCloseForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleSubmitProduct = async (formData) => {
    try {
      setSavingProduct(true);
      if (editingProduct) {
        await productAPI.updateProduct(editingProduct.id, {
          name: formData.name,
          category: formData.category,
          description: formData.description,
          price: formData.price,
          stock: formData.stock,
          reorderLevel: formData.reorderLevel
        });
        showSuccess('Product updated successfully');
      } else {
        const createPayload = {
          name: formData.name,
          category: formData.category,
          description: formData.description,
          price: formData.price,
          stock: formData.stock,
          reorderLevel: formData.reorderLevel,
          specifications: formData.specifications,
          compatibility: formData.compatibility
        };

        const createResponse = await productAPI.createProduct(createPayload);
        const createdProduct = createResponse.data?.data;

        if (createdProduct?.id && Array.isArray(formData.imageFiles) && formData.imageFiles.length > 0) {
          const uploadFormData = new FormData();
          formData.imageFiles.forEach((file) => {
            uploadFormData.append('images', file);
          });
          await productAPI.uploadProductImages(createdProduct.id, uploadFormData);
        }

        showSuccess('Product created successfully');
      }
      handleCloseForm();
      await fetchProducts();
      await fetchDashboard();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    try {
      await productAPI.deleteProduct(productId);
      showSuccess('Product deleted successfully');
      await fetchProducts();
      await fetchDashboard();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleUpdateShop = async (e) => {
    e.preventDefault();
    try {
      setSavingShop(true);
      await sellerAPI.updateMyShop(shopFormData);
      showSuccess('Shop profile updated successfully');
      await fetchShop();
      await fetchDashboard();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update shop profile');
    } finally {
      setSavingShop(false);
    }
  };

  const handleDocumentsSelected = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8);
    if (!files.length) return;
    const fd = new FormData();
    files.forEach(f => fd.append('documents', f));

    try {
      setUploadingDocs(true);
      await sellerAPI.uploadDocuments(fd);
      showSuccess('Documents uploaded. Admin will review them shortly.');
      fetchMyDocuments();
      fetchDashboard();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const response = await sellerAPI.downloadInventoryInvoice();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers?.['content-disposition'] || '';
      const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);

      link.href = url;
      link.download = filenameMatch?.[1] || `inventory-invoice-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccess('Inventory invoice downloaded');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to download inventory invoice');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await sellerAPI.updateOrderStatus(orderId, { status });
      showSuccess('Order status updated');
      await fetchOrders();
      await fetchDashboard();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const tabClass = (tab) => `
    px-3 sm:px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm sm:text-base
    ${activeTab === tab 
      ? 'bg-yellow-500 text-white' 
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
    }
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
            Seller Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your shop, products, and orders.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm border border-amber-200 text-sm font-semibold text-amber-800">
            Shop status: {shopStatus}
          </div>
          {/* Verification prompt & upload */}
          {!isVerifiedShop && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm text-yellow-900 mb-2">Your shop is not verified. Please upload the required documents so an admin can review and verify your shop.</p>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer">
                  <input type="file" multiple accept="image/*,.pdf" onChange={handleDocumentsSelected} className="hidden" />
                  <span className="text-sm font-semibold text-yellow-800">Select documents</span>
                </label>
                <span className="text-sm text-gray-600">You can upload ID, shop registration certificate, and supporting documents (images or PDFs).</span>
              </div>

              {uploadingDocs && <p className="text-sm text-gray-600 mt-2">Uploading documents...</p>}

              {sellerDocs && sellerDocs.length > 0 && (
                <div className="mt-3 bg-white border rounded p-3">
                  <p className="text-sm font-semibold mb-2">Uploaded documents</p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {sellerDocs.map(doc => (
                      <li key={doc.id} className="flex items-center justify-between">
                        <div>
                          <button onClick={async () => {
                            try {
                              const resp = await apiClient.get(doc.downloadUrl || doc.url, { responseType: 'blob' });
                              const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/octet-stream' });
                              const blobUrl = window.URL.createObjectURL(blob);
                              window.open(blobUrl, '_blank');
                              setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
                            } catch (err) {
                              console.debug('Failed to open document', err);
                            }
                          }} className="text-blue-600 hover:underline">{doc.filename}</button>
                          <div className="text-xs text-gray-500">Status: {doc.status}</div>
                        </div>
                        <div className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="mt-3">
            <button
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold shadow hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              <FaFileArrowDown size={16} />
              {downloadingInvoice ? 'Preparing PDF...' : 'Download Inventory Invoice'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md p-2 sm:p-4 mb-6 sm:mb-8 flex flex-wrap gap-2">
          <button
            className={tabClass('overview')}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartBar size={16} />
            <span>Overview</span>
          </button>
          <button
            className={tabClass('products')}
            onClick={() => setActiveTab('products')}
          >
            <FaBox size={16} />
            <span>Products</span>
          </button>
          <button
            className={tabClass('orders')}
            onClick={() => setActiveTab('orders')}
          >
            <FaCartShopping size={16} />
            <span>Orders</span>
          </button>
          <button
            className={tabClass('shop')}
            onClick={() => setActiveTab('shop')}
          >
              <FaGear size={16} />
            <span>Settings</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center text-gray-600">
            <p>Loading seller data...</p>
          </div>
        )}

        {/* Overview Tab */}
        {!loading && activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <p className="text-gray-600 text-sm">Total Products</p>
              <p className="text-3xl sm:text-4xl font-bold text-yellow-600">{stats.totalProducts}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <p className="text-gray-600 text-sm">Active Products</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-600">{stats.activeProducts}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <p className="text-gray-600 text-sm">Low Stock</p>
              <p className="text-3xl sm:text-4xl font-bold text-red-600">{stats.lowStockProducts}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-600">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <p className="text-gray-600 text-sm">Pending Orders</p>
              <p className="text-3xl sm:text-4xl font-bold text-orange-600">{stats.pendingOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <p className="text-gray-600 text-sm">Total Sales</p>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600">
                KES {Number(stats.totalSales || 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {!loading && activeTab === 'products' && (
          <div className="space-y-4 sm:space-y-6">
            {!isVerifiedShop && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900">
                Your shop is not verified yet, so product publishing is disabled until an admin approves it.
              </div>
            )}

            {/* Create Product Button */}
            <button
              onClick={handleCreateProduct}
              disabled={!isVerifiedShop}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-lg transition shadow-lg ${
                isVerifiedShop
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              <FaPlus size={18} />
              Create New Product
            </button>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FaBox className="mx-auto text-4xl text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg mb-4">No products yet</p>
                <button
                  onClick={handleCreateProduct}
                  disabled={!isVerifiedShop}
                  className={`inline-flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition ${
                    isVerifiedShop ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <FaPlus /> Create First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    loading={savingProduct}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {!loading && activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Seller Orders</h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <FaCartShopping className="mx-auto text-4xl text-gray-300 mb-4" />
                <p className="text-gray-600">No orders found for your products.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 overflow-x-auto">
                {orders.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 truncate">
                            Order #{item.orderId} - {item.productName}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Qty: {item.quantity} | Subtotal: KES {Number(item.subtotal).toLocaleString()}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Buyer: {item.Order?.User?.name || 'N/A'} ({item.Order?.User?.phone || 'N/A'})
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Status: <span className="font-semibold">{item.Order?.status}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {item.Order?.status !== 'processing' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(item.orderId, 'processing')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs sm:text-sm font-semibold transition"
                          >
                            Processing
                          </button>
                        )}
                        {item.Order?.status !== 'shipped' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(item.orderId, 'shipped')}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-xs sm:text-sm font-semibold transition"
                          >
                            Shipped
                          </button>
                        )}
                        {item.Order?.status !== 'delivered' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(item.orderId, 'delivered')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs sm:text-sm font-semibold transition"
                          >
                            Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shop Settings Tab */}
        {!loading && activeTab === 'shop' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Shop Settings</h2>
            
            <form onSubmit={handleUpdateShop} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shop Name
                </label>
                <input
                  type="text"
                  value={shopFormData?.shopName || ''}
                  onChange={(e) => setShopFormData(prev => ({ ...prev, shopName: e.target.value }))}
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Your shop name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shop Description
                </label>
                <textarea
                  value={shopFormData?.shopDescription || ''}
                  onChange={(e) => setShopFormData(prev => ({ ...prev, shopDescription: e.target.value }))}
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Describe your shop..."
                  rows="4"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={shopFormData?.location || ''}
                  onChange={(e) => setShopFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Shop location/address"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="flex-1 px-4 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingShop}
                  className="flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {savingShop ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          isEditing={!!editingProduct}
          onSubmit={handleSubmitProduct}
          onCancel={handleCloseForm}
          loading={savingProduct}
          categories={categories}
        />
      )}
    </div>
  );
};

export default SellerDashboardPage;
