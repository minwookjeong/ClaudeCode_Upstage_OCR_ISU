import { useEffect, useRef } from 'react'

function fmt(n) {
  return (n ?? 0).toLocaleString('ko-KR')
}

// ── 로딩 스켈레톤 ─────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 animate-pulse">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-12 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

// ── 카테고리 미니 바 ──────────────────────────────────────────
function CategoryBar({ category, amount, maxAmount }) {
  const pct = maxAmount > 0 ? Math.round((amount / maxAmount) * 100) : 0
  const barRef = useRef(null)

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${pct}%`
    }
  }, [pct])

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 truncate max-w-[80px]">{category}</span>
        <span className="text-gray-500 tabular-nums">{fmt(amount)}원</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full bg-indigo-400 rounded-full transition-all duration-700"
          style={{ width: 0 }}
        />
      </div>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function SummaryCard({ summary, loading }) {
  if (loading || !summary) return <Skeleton />

  const thisMonth = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
  const topCategories = (summary.category_summary ?? []).slice(0, 4)
  const maxAmount = topCategories[0]?.amount ?? 1

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">

      {/* ── 전체 지출 ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">전체 지출</p>
        <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1.5 leading-none">
          {fmt(summary.total_amount)}
          <span className="text-base font-semibold ml-1">원</span>
        </p>
        <p className="text-xs text-gray-400 mt-2">{summary.count}건 등록됨</p>
      </div>

      {/* ── 이번달 지출 (강조) ── */}
      <div className="bg-indigo-600 rounded-2xl p-5 text-white">
        <p className="text-xs font-medium text-indigo-200 uppercase tracking-wide">이번달 지출</p>
        <p className="text-2xl font-bold tabular-nums mt-1.5 leading-none">
          {fmt(summary.this_month_amount)}
          <span className="text-base font-semibold ml-1">원</span>
        </p>
        <p className="text-xs text-indigo-300 mt-2">{thisMonth}</p>
      </div>

      {/* ── 카테고리별 ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">카테고리별</p>
        {topCategories.length > 0 ? (
          <div className="space-y-2.5">
            {topCategories.map((c) => (
              <CategoryBar
                key={c.category}
                category={c.category}
                amount={c.amount}
                maxAmount={maxAmount}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">데이터 없음</p>
        )}
      </div>

    </div>
  )
}
