import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import apiClient from '../services/api';
import { useNotification } from '../context/NotificationContext';

const AdminDashboardPage = () => {
  const { success: showSuccess, error: showError } = useNotification();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState({});
  const [selectedSellerDocs, setSelectedSellerDocs] = useState([]);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [currentSellerId, setCurrentSellerId] = useState(null);

  const fetchDashboard = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboard(response.data?.data || null);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load admin dashboard');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load users');
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await adminAPI.getSellers();
      setSellers(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load sellers');
    }
  };

  const fetchSellerDocs = async (sellerId) => {
    try {
      const res = await adminAPI.getSellerDocuments(sellerId);
      setSelectedSellerDocs(Array.isArray(res.data?.data) ? res.data.data : []);
      setCurrentSellerId(sellerId);
      setDocsModalOpen(true);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load seller documents');
    }
  };

  const approveDoc = async (sellerId, docId) => {
    try {
      await adminAPI.approveSellerDocument(currentSellerId, docId);
      showSuccess('Document approved');
      // refresh list
      await fetchSellerDocs(sellerId);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to approve document');
    }
  };

  const rejectDoc = async (sellerId, docId) => {
    try {
      await adminAPI.rejectSellerDocument(currentSellerId, docId, {});
      showSuccess('Document rejected');
      await fetchSellerDocs(sellerId);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reject document');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await adminAPI.getOrdersTracking();
      setOrders(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load orders');
    }
  };

  const fetchOrderStatusBreakdown = async () => {
    try {
      const response = await adminAPI.getOrdersStatus();
      setOrderStatusBreakdown(response.data?.data || {});
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load order status analytics');
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await adminAPI.getTransactions();
      setTransactions(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load transactions');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchDashboard();
      await Promise.all([
        fetchUsers(),
        fetchSellers(),
        fetchOrders(),
        fetchTransactions(),
        fetchOrderStatusBreakdown()
      ]);
      setLoading(false);
    };

    load();
  }, []);

  const toggleSellerApproval = async (id) => {
    try {
      await adminAPI.toggleSellerApproval(id);
      showSuccess('Seller status updated successfully');
      await fetchSellers();
      await fetchDashboard();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update seller status');
    }
  };

  const suspendSeller = async (id) => {
    try {
      await adminAPI.suspendSeller(id);
      showSuccess('Seller suspension updated successfully');
      await fetchSellers();
      await fetchDashboard();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update seller suspension');
    }
  };

  const tabClass = (tab) => `px-4 py-2 rounded-lg font-semibold ${activeTab === tab ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`;
  const statusBadge = (seller) => {
    if (seller?.User?.status === 'suspended') {
      return 'bg-red-100 text-red-800';
    }

    return seller?.verificationStatus === 'verified'
      ? 'bg-green-100 text-green-800'
      : seller?.verificationStatus === 'rejected'
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-6">Manage platform users, sellers, orders, and transactions.</p>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap gap-2">
          <button className={tabClass('overview')} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={tabClass('sellers')} onClick={() => setActiveTab('sellers')}>Seller Approvals</button>
          <button className={tabClass('users')} onClick={() => setActiveTab('users')}>Users</button>
          <button className={tabClass('orders')} onClick={() => setActiveTab('orders')}>Orders</button>
          <button className={tabClass('transactions')} onClick={() => setActiveTab('transactions')}>Transactions</button>
        </div>

        {loading && <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">Loading admin data...</div>}

        {!loading && activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6"><p className="text-gray-600">Total Users</p><p className="text-3xl font-bold text-blue-600">{dashboard?.stats?.totalUsers || 0}</p></div>
              <div className="bg-white rounded-lg shadow-md p-6"><p className="text-gray-600">Total Sellers</p><p className="text-3xl font-bold text-indigo-600">{dashboard?.stats?.totalSellers || 0}</p></div>
              <div className="bg-white rounded-lg shadow-md p-6"><p className="text-gray-600">Pending Sellers</p><p className="text-3xl font-bold text-orange-600">{dashboard?.stats?.pendingSellers || 0}</p></div>
              <div className="bg-white rounded-lg shadow-md p-6"><p className="text-gray-600">Products</p><p className="text-3xl font-bold text-green-600">{dashboard?.stats?.totalProducts || 0}</p></div>
              <div className="bg-white rounded-lg shadow-md p-6"><p className="text-gray-600">Orders</p><p className="text-3xl font-bold text-purple-600">{dashboard?.stats?.totalOrders || 0}</p></div>
              <div className="bg-white rounded-lg shadow-md p-6"><p className="text-gray-600">Revenue</p><p className="text-3xl font-bold text-yellow-700">KES {Number(dashboard?.stats?.totalRevenue || 0).toLocaleString()}</p></div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Order Status Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {Object.keys(orderStatusBreakdown).length === 0 && <p className="text-gray-600">No status data available.</p>}
                {Object.entries(orderStatusBreakdown).map(([status, count]) => (
                  <div key={status} className="rounded-lg border p-3 bg-gray-50">
                    <p className="text-gray-600 capitalize">{status.replace(/_/g, ' ')}</p>
                    <p className="text-2xl font-bold text-gray-800">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'sellers' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Seller Verification</h2>
            <div className="space-y-3">
              {sellers.length === 0 && <p className="text-gray-600">No sellers found.</p>}
              {sellers.map((seller) => (
                <div key={seller.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-800">{seller.shopName}</p>
                    <p className="text-sm text-gray-600">Owner: {seller.User?.name} ({seller.User?.email})</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-sm">
                      <span className={`px-3 py-1 rounded-full font-semibold ${statusBadge(seller)}`}>
                        {seller.User?.status === 'suspended' ? 'Suspended' : seller.verificationStatus}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                        {seller.User?.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleSellerApproval(seller.id)}
                      className={`px-3 py-2 rounded text-white transition ${seller.verificationStatus === 'verified' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {seller.verificationStatus === 'verified' ? 'Revoke Approval' : 'Approve'}
                    </button>
                    <button
                      onClick={() => suspendSeller(seller.id)}
                      className={`px-3 py-2 rounded text-white transition ${seller.User?.status === 'suspended' ? 'bg-slate-600 hover:bg-slate-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {seller.User?.status === 'suspended' ? 'Restore' : 'Suspend'}
                    </button>
                  </div>
                    <div className="mt-2">
                      <button onClick={() => fetchSellerDocs(seller.id)} className="text-sm text-blue-600 underline">View Documents</button>
                    </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {docsModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <h3 className="text-lg font-bold mb-4">Seller Documents</h3>
              <div className="space-y-2 max-h-96 overflow-auto">
                {selectedSellerDocs.length === 0 && <p className="text-gray-600">No documents found.</p>}
                {selectedSellerDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between border-b py-2">
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-sm text-gray-500">Status: {doc.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        try {
                          const resp = await apiClient.get(doc.downloadUrl || doc.url, { responseType: 'blob' });
                          const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/octet-stream' });
                          const blobUrl = window.URL.createObjectURL(blob);
                          window.open(blobUrl, '_blank');
                          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
                        } catch (err) {
                          showError(err.response?.data?.message || 'Failed to open document');
                        }
                      }} className="text-blue-600 underline">Open</button>
                      {doc.status !== 'approved' && (
                        <button onClick={() => approveDoc(doc.sellerId || /* fallback */ doc.sellerId, doc.id)} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Approve</button>
                      )}
                      {doc.status !== 'rejected' && (
                        <button onClick={() => rejectDoc(doc.sellerId || doc.sellerId, doc.id)} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Reject</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button onClick={async () => {
                    try {
                      await adminAPI.verifySeller(currentSellerId);
                      showSuccess('Seller verified successfully');
                      await fetchSellers();
                      setDocsModalOpen(false);
                    } catch (err) {
                      showError(err.response?.data?.message || 'Failed to verify seller');
                    }
                  }} className="px-4 py-2 rounded bg-green-600 text-white">Verify Shop</button>
                  <button onClick={() => setDocsModalOpen(false)} className="px-4 py-2 rounded bg-gray-200">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="py-2">{u.name}</td>
                      <td className="py-2">{u.email}</td>
                      <td className="py-2">{u.role}</td>
                      <td className="py-2">{u.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Orders</h2>
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="border rounded p-3 flex flex-col md:flex-row md:justify-between gap-2">
                  <div>
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-sm text-gray-600">Buyer: {o.User?.name} ({o.User?.email})</p>
                  </div>
                  <div className="text-sm">
                    <p>Status: <span className="font-semibold">{o.status}</span></p>
                    <p>Total: KES {Number(o.totalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Transactions</h2>
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="border rounded p-3 flex flex-col md:flex-row md:justify-between gap-2">
                  <div>
                    <p className="font-semibold">Order #{t.Order?.orderNumber || t.orderId}</p>
                    <p className="text-sm text-gray-600">User: {t.User?.name} ({t.User?.email})</p>
                  </div>
                  <div className="text-sm">
                    <p>Status: <span className="font-semibold">{t.status}</span></p>
                    <p>Amount: KES {Number(t.amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
