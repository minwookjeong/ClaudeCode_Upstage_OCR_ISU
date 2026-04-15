import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()
  const isUpload = pathname === '/upload'

  return (
    <header className="sticky top-0 z-40 h-16 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 h-full flex items-center justify-between">
        {/* 로고 */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-gray-900 hover:text-indigo-600 transition-colors"
        >
          <span className="text-xl">🧾</span>
          <span className="text-lg">영수증 지출 관리</span>
        </Link>

        {/* 우측 액션 */}
        {isUpload ? (
          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            대시보드
          </Link>
        ) : (
          <Link
            to="/upload"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            영수증 추가
          </Link>
        )}
      </div>
    </header>
  )
}
