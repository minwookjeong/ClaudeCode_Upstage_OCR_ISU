import { useState } from 'react'

export default function FilterBar({ onFilter, onReset, isFiltered = false }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const handleFilter = () => {
    if (from && to && from > to) return  // 시작 > 종료 방지
    onFilter(from, to)
  }

  const handleReset = () => {
    setFrom('')
    setTo('')
    onReset()
  }

  const inputCls =
    'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-white'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* 기간 레이블 */}
        <span className="text-sm font-medium text-gray-500 whitespace-nowrap">기간</span>

        {/* 시작일 */}
        <input
          type="date"
          className={inputCls}
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
        />

        <span className="text-gray-400 text-sm">~</span>

        {/* 종료일 */}
        <input
          type="date"
          className={inputCls}
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
        />

        {/* 조회 버튼 */}
        <button
          onClick={handleFilter}
          disabled={!from && !to}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          조회
        </button>

        {/* 초기화 버튼 — 필터 활성 시에만 표시 */}
        {isFiltered && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg border border-gray-300 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            초기화
          </button>
        )}
      </div>

      {/* 필터 적용 중 안내 */}
      {isFiltered && (
        <p className="text-xs text-indigo-600 mt-2 font-medium">
          ● 날짜 필터가 적용되어 있습니다
        </p>
      )}
    </div>
  )
}
