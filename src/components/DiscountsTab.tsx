import React, { useEffect, useState } from 'react'
import { discountAPI } from '../utils/api'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorAlert } from './ErrorAlert'
import { Percent, CheckCircle, XCircle, RefreshCcw, ExternalLink, User, Calendar, Tag } from 'lucide-react'
import { DiscountVerification, DiscountVerificationsResponse } from '../types'
import { useAuth } from '../context/AuthContext'

export const DiscountsTab: React.FC = () => {
  const { user: adminUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifications, setVerifications] = useState<DiscountVerification[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchVerifications = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await discountAPI.getVerifications({ 
        page, 
        limit, 
        status: statusFilter !== 'all' ? statusFilter : undefined 
      })
      const data = res.data as DiscountVerificationsResponse
      const list = data.verifications || []
      setTotal(data.pagination?.total || list.length)
      setVerifications(list)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch discount verifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVerifications()
  }, [page, limit, statusFilter])

  const filtered = verifications // Removed local filter as it's now handled by API

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    setUpdatingId(id)
    setError(null)
    try {
      const res = await discountAPI.updateVerificationStatus(id, status, reason, adminUser?.id)
      if (res && res.data) {
        const updated = res.data as DiscountVerification
        setVerifications(prev => prev.map(v => v.id === id ? updated : v))
        setShowRejectModal(false)
        setRejectionReason('')
        setSelectedId(null)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const openRejectModal = (id: string) => {
    setSelectedId(id)
    setShowRejectModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <Percent className="h-6 w-6 mr-2 text-pink-600" />
          Discount Verifications
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button
            onClick={fetchVerifications}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 flex items-center shadow-sm"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      {loading && verifications.length === 0 ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Image</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted At</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                        <User className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">
                          {v.user?.profile?.fullName || v.user?.username || 'Unknown User'}
                        </div>
                        <div className="text-xs text-gray-500">{v.user?.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      <Tag className="h-3 w-3 mr-1" />
                      {v.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a 
                      href={v.id_image_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center group"
                    >
                      <ExternalLink className="h-4 w-4 mr-1 transition-transform group-hover:scale-110" />
                      View ID
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                      v.status === 'approved' ? 'bg-green-100 text-green-800' :
                      v.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {v.status.toUpperCase()}
                    </span>
                    {v.status === 'rejected' && v.rejection_reason && (
                      <div className="text-[10px] text-red-600 mt-1 max-w-[150px] truncate" title={v.rejection_reason}>
                        Reason: {v.rejection_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {new Date(v.submitted_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {v.status === 'pending' ? (
                        <>
                          <button
                            disabled={updatingId === v.id}
                            onClick={() => handleUpdateStatus(v.id, 'approved')}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition flex items-center shadow-sm disabled:opacity-60"
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Approve
                          </button>
                          <button
                            disabled={updatingId === v.id}
                            onClick={() => openRejectModal(v.id)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition flex items-center shadow-sm disabled:opacity-60"
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(v.id, 'pending')}
                          className="text-gray-500 hover:text-gray-700 text-xs font-medium underline"
                        >
                          Reset to Pending
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-12 text-center text-gray-500 text-sm" colSpan={6}>
                    <div className="flex flex-col items-center">
                      <Percent className="h-12 w-12 text-gray-200 mb-2" />
                      <p>No discount verification requests found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="text-sm text-gray-600 font-medium">
          Showing <span className="text-gray-900">{filtered.length}</span> of <span className="text-gray-900">{total}</span> total verifications
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <div className="bg-pink-50 text-pink-600 px-3 py-1.5 rounded-md font-bold text-sm border border-pink-100">
            {page}
          </div>
          <button
            disabled={filtered.length < limit}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white focus:ring-2 focus:ring-pink-500 outline-none"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <XCircle className="h-6 w-6 text-red-600 mr-2" />
              Reject Verification
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Please provide a reason for rejecting this discount verification request. The user will be notified.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., ID is blurred, expired, or doesn't match profile name."
              className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none text-sm"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setSelectedId(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!rejectionReason.trim() || updatingId !== null}
                onClick={() => selectedId && handleUpdateStatus(selectedId, 'rejected', rejectionReason)}
                className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updatingId ? 'Processing...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
