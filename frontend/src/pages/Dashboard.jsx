import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ExpenseCard, { ExpenseCardSkeleton } from '../components/ExpenseCard'
import FilterBar from '../components/FilterBar'
import Header from '../components/Header'
import SummaryCard from '../components/SummaryCard'
import { useToast } from '../contexts/ToastContext'

// ── 빈 상태 ──────────────────────────────────────────────────
function EmptyState({ isFiltered }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
        <span className="text-4xl">🧾</span>
      </div>
      {isFiltered ? (
        <>
          <h3 className="text-base font-semibold text-gray-700">해당 기간에 지출 내역이 없습니다</h3>
          <p className="text-sm text-gray-400 mt-1">날짜 범위를 조정하거나 필터를 초기화해 보세요</p>
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-gray-700">아직 등록된 지출이 없습니다</h3>
          <p className="text-sm text-gray-400 mt-1">영수증을 업로드해서 첫 지출을 기록해 보세요</p>
          <Link
            to="/upload"
            className="mt-5 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            영수증 추가
          </Link>
        </>
      )}
    </div>
  )
}

// ── 카드 그리드 스켈레톤 ──────────────────────────────────────
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ExpenseCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── 대시보드 메인 ─────────────────────────────────────────────
export default function Dashboard() {
  const showToast = useToast()

  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFiltered, setIsFiltered] = useState(false)

  // ── API 호출 ────────────────────────────────────────────────
  const fetchAll = useCallback(
    async (fromDate = '', toDate = '') => {
      setLoading(true)
      try {
        const expParams = {}
        if (fromDate) expParams.from_date = fromDate
        if (toDate)   expParams.to_date   = toDate

        // expenses + summary 병렬 호출
        const [expRes, sumRes] = await Promise.all([
          api.get('/api/expenses', { params: expParams }),
          api.get('/api/summary'),          // summary는 항상 전체 기준
        ])

        setExpenses(expRes.data)
        setSummary(sumRes.data)
      } catch (err) {
        const msg =
          err.response?.data?.detail ??
          err.message ??
          '데이터를 불러오는 중 오류가 발생했습니다.'
        showToast(msg, 'error')
      } finally {
        setLoading(false)
      }
    },
    [showToast],
  )

  // 마운트 시 전체 조회
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── 필터 핸들러 ─────────────────────────────────────────────
  const handleFilter = (from, to) => {
    setIsFiltered(!!(from || to))
    fetchAll(from, to)
  }

  const handleReset = () => {
    setIsFiltered(false)
    fetchAll()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">

        {/* ── 페이지 타이틀 ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">지출 대시보드</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? '불러오는 중…'
                : `총 ${expenses.length}건${isFiltered ? ' (필터 적용)' : ''}`}
            </p>
          </div>
        </div>

        {/* ── 요약 카드 ── */}
        <SummaryCard summary={summary} loading={loading} />

        {/* ── 필터 바 ── */}
        <FilterBar
          onFilter={handleFilter}
          onReset={handleReset}
          isFiltered={isFiltered}
        />

        {/* ── 지출 카드 목록 ── */}
        {loading ? (
          <GridSkeleton />
        ) : expenses.length === 0 ? (
          <EmptyState isFiltered={isFiltered} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        )}

      </main>

      {/* ── 푸터 ── */}
      <footer className="py-6 text-center text-xs text-gray-300 border-t border-gray-100">
        Receipt Expense Tracker · Powered by Upstage AI
      </footer>
    </div>
  )
}
