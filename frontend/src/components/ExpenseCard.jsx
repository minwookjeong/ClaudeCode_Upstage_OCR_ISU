import { useNavigate } from 'react-router-dom'
import Badge from './Badge'

function fmt(n) {
  return (n ?? 0).toLocaleString('ko-KR')
}

// ── 로딩 스켈레톤 ─────────────────────────────────────────────
export function ExpenseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="h-6 w-24 bg-gray-200 rounded" />
      <div className="h-3 w-16 bg-gray-200 rounded" />
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function ExpenseCard({ expense }) {
  const navigate = useNavigate()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/expense/${expense.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/expense/${expense.id}`)}
      className="bg-white rounded-2xl border border-gray-200 p-4 cursor-pointer
                 hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5
                 transition-all duration-200 animate-fade-in group"
    >
      {/* 상단: 카테고리 뱃지 + 날짜 */}
      <div className="flex items-center justify-between mb-3">
        <Badge category={expense.category} />
        <span className="text-xs text-gray-400 tabular-nums">
          {expense.receipt_date ?? '-'}
        </span>
      </div>

      {/* 가게명 */}
      <p className="font-semibold text-gray-900 text-base truncate leading-tight">
        {expense.store_name || '(상호 미확인)'}
      </p>

      {/* 금액 */}
      <p className="text-xl font-bold text-indigo-700 tabular-nums mt-2 leading-none">
        {fmt(expense.total_amount)}
        <span className="text-sm font-semibold ml-0.5">원</span>
      </p>

      {/* 결제수단 + 화살표 */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">
          {expense.payment_method ?? '-'}
        </span>
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}
