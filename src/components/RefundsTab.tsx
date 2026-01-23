import React, { useEffect, useState } from 'react'
import { refundAPI } from '../utils/api'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorAlert } from './ErrorAlert'
import { FileText, CheckCircle, XCircle, RefreshCcw, ExternalLink } from 'lucide-react'
import { RefundRequest, RefundsResponse } from '../types'

export const RefundsTab: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refunds, setRefunds] = useState<RefundRequest[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchRefunds = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await refundAPI.getRefunds({ page, limit })
      const data = res.data as RefundsResponse
      const list = data.refunds || []
      setTotal(data.pagination?.total || list.length)
      setRefunds(list)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch refunds')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRefunds()
  }, [page, limit])

  const filtered = refunds.filter(r => statusFilter === 'all' ? true : r.status === statusFilter)

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setUpdatingId(id)
    setError(null)
    try {
      const res = await refundAPI.updateRefundStatus(id, status)
      const updated = res.data as RefundRequest
      setRefunds(prev => prev.map(r => r.id === id ? updated : r))
    } catch (err: any) {
      setError(err?.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileText className="h-6 w-6 mr-2 text-pink-600" />
          Refund Requests
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={fetchRefunds}
            className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all duration-200 flex items-center"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}
      {loading && refunds.length === 0 ? <LoadingSpinner /> : null}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">{r.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {r.proof_url ? (
                    <a href={r.proof_url} target="_blank" rel="noreferrer" className="text-pink-600 inline-flex items-center">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </a>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    r.status === 'approved' ? 'bg-green-100 text-green-800' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={updatingId === r.id}
                      onClick={() => updateStatus(r.id, 'approved')}
                      className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition flex items-center disabled:opacity-60"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      disabled={updatingId === r.id}
                      onClick={() => updateStatus(r.id, 'rejected')}
                      className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition flex items-center disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500 text-sm" colSpan={7}>
                  No refund requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Total: {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="text-sm">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Next
          </button>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-2 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  )
}

