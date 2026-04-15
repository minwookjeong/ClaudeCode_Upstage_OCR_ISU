export default function ProgressBar({ visible }) {
  if (!visible) return null

  return (
    <div className="w-full space-y-3 animate-fade-in">
      {/* 상태 텍스트 */}
      <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span>AI가 영수증을 분석하고 있습니다…</span>
      </div>

      {/* 인디케이터 바 */}
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden relative">
        <div className="absolute h-full w-2/5 bg-indigo-500 rounded-full animate-progress-indeterminate" />
      </div>

      <p className="text-xs text-gray-400">
        Upstage Document Digitization API 처리 중 · 최대 10초 소요
      </p>
    </div>
  )
}
