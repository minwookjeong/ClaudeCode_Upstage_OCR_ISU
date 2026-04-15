import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import Badge from '../components/Badge'
import DeleteModal from '../components/DeleteModal'
import Header from '../components/Header'
import ParsePreview from '../components/ParsePreview'
import ReceiptImage from '../components/ReceiptImage'
import { useToast } from '../contexts/ToastContext'

function fmt(n) {
  return (n ?? 0).toLocaleString('ko-KR')
}

// ── 로딩 스켈레톤 ─────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 animate-pulse">
      <div className="bg-gray-200 rounded-2xl min-h-[360px]" />
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 rounded" />
        </div>
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="h-9 w-36 bg-gray-200 rounded" />
        <div className="h-px bg-gray-100" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 정보 행 ───────────────────────────────────────────────────
function InfoRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide min-w-[72px]">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right">{value}</span>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function ExpenseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()

  const [expense, setExpense] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [mode, setMode] = useState('view')       // 'view' | 'edit'
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ── 단건 조회 ───────────────────────────────────────────────
  const fetchExpense = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/expenses/${id}`)
      setExpense(res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true)
      } else {
        showToast(err.response?.data?.detail ?? '불러오기 실패', 'error')
      }
    } finally {
      setLoading(false)
    }
  }, [id, showToast])

  useEffect(() => {
    fetchExpense()
  }, [fetchExpense])

  // ── 저장 ────────────────────────────────────────────────────
  const handleSave = async (form) => {
    setIsSaving(true)
    try {
      const res = await api.put(`/api/expenses/${id}`, form)
      setExpense(res.data)
      syncLocalStorage(res.data)
      showToast('저장되었습니다', 'success')
      setMode('view')
    } catch (err) {
      showToast(err.response?.data?.detail ?? '저장 실패', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // ── 삭제 ────────────────────────────────────────────────────
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await api.delete(`/api/expenses/${id}`)
      removeFromLocalStorage(id)
      showToast('삭제되었습니다', 'success')
      navigate('/')
    } catch (err) {
      showToast(err.response?.data?.detail ?? '삭제 실패', 'error')
      setIsDeleting(false)
      setShowDelete(false)
    }
  }

  // ── localStorage 동기화 ──────────────────────────────────────
  function syncLocalStorage(updated) {
    const stored = JSON.parse(localStorage.getItem('expenses') || '[]')
    const idx = stored.findIndex((e) => e.id === updated.id)
    if (idx >= 0) stored[idx] = updated
    else stored.unshift(updated)
    localStorage.setItem('expenses', JSON.stringify(stored))
  }

  function removeFromLocalStorage(expId) {
    const stored = JSON.parse(localStorage.getItem('expenses') || '[]')
    localStorage.setItem('expenses', JSON.stringify(stored.filter((e) => e.id !== expId)))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">

        {/* ── 브레드크럼 ── */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            대시보드
          </button>
          <span className="text-gray-200">/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px]">
            {loading ? '로드 중…' : expense?.store_name || '지출 상세'}
          </span>
        </div>

        {/* ── 콘텐츠 ── */}
        {loading ? (
          <DetailSkeleton />
        ) : notFound ? (
          // ── 404 상태 ──────────────────────────────────────────
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-700">항목을 찾을 수 없습니다</h3>
            <p className="text-sm text-gray-400 mt-1">이미 삭제되었거나 존재하지 않는 항목입니다</p>
            <button
              onClick={() => navigate('/')}
              className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              대시보드로 돌아가기
            </button>
          </div>
        ) : mode === 'edit' ? (
          // ── 수정 모드 ─────────────────────────────────────────
          <ParsePreview
            data={expense}
            onSave={handleSave}
            onCancel={() => setMode('view')}
            isSaving={isSaving}
          />
        ) : (
          // ── 상세 보기 모드 ────────────────────────────────────
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 animate-fade-in">

            {/* 영수증 이미지 */}
            <ReceiptImage path={expense.raw_image_path} />

            {/* 상세 정보 카드 */}
            <div className="bg-white rounded-2xl border border-gray-200 flex flex-col">

              {/* 헤더 영역 */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge category={expense.category} />
                  <span className="text-xs text-gray-400">{expense.receipt_date ?? '-'}</span>
                  {expense.receipt_time && (
                    <span className="text-xs text-gray-400">{expense.receipt_time}</span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {expense.store_name || '(상호 미확인)'}
                </h2>
                <p className="text-3xl font-bold text-indigo-700 tabular-nums mt-3 leading-none">
                  {fmt(expense.total_amount)}
                  <span className="text-lg font-semibold ml-1">원</span>
                </p>
              </div>

              {/* 기본 정보 */}
              <div className="px-6 py-4">
                <InfoRow label="결제수단" value={expense.payment_method} />
                <InfoRow
                  label="소계"
                  value={expense.subtotal != null ? `${fmt(expense.subtotal)}원` : null}
                />
                {(expense.discount ?? 0) > 0 && (
                  <InfoRow label="할인" value={`-${fmt(expense.discount)}원`} />
                )}
                {(expense.tax ?? 0) > 0 && (
                  <InfoRow label="세금" value={`${fmt(expense.tax)}원`} />
                )}
              </div>

              {/* 품목 목록 */}
              {expense.items?.length > 0 && (
                <div className="px-6 pb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">품목</p>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-[1fr_48px_76px_76px] gap-2 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-400">
                      <span>품명</span>
                      <span className="text-right">수량</span>
                      <span className="text-right">단가</span>
                      <span className="text-right">합계</span>
                    </div>
                    {expense.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[1fr_48px_76px_76px] gap-2 px-3 py-2 border-t border-gray-100 text-sm"
                      >
                        <span className="text-gray-800 truncate">{item.name}</span>
                        <span className="text-right text-gray-500 tabular-nums">{item.quantity}</span>
                        <span className="text-right text-gray-500 tabular-nums">{fmt(item.unit_price)}</span>
                        <span className="text-right text-gray-800 font-medium tabular-nums">{fmt(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="mt-auto px-6 pb-6 pt-4 flex gap-3 border-t border-gray-100">
                <button
                  onClick={() => setMode('edit')}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700
                             text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  수정
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="px-5 py-2.5 bg-white hover:bg-red-50 text-red-500 hover:text-red-600
                             font-semibold rounded-lg border border-gray-200 hover:border-red-200
                             text-sm transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 푸터 */}
      <footer className="py-6 text-center text-xs text-gray-300 border-t border-gray-100">
        Receipt Expense Tracker · Powered by Upstage AI
      </footer>

      {/* 삭제 확인 모달 */}
      {showDelete && (
        <DeleteModal
          storeName={expense?.store_name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}
