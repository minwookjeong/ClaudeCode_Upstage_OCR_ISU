import { useState } from 'react'

export default function ReceiptImage({ path }) {
  const [status, setStatus] = useState('loading') // loading | loaded | error
  const [fullscreen, setFullscreen] = useState(false)

  if (!path) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 aspect-[3/4] flex flex-col items-center justify-center text-gray-300">
        <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-xs">이미지 없음</p>
      </div>
    )
  }

  // raw_image_path: "uploads/receipt_xxx.jpg" → "/uploads/receipt_xxx.jpg"
  const src = `/${path}`

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* 이미지 영역 */}
        <div className="relative bg-gray-50 min-h-[240px] flex items-center justify-center">
          {/* 로딩 스켈레톤 */}
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
              <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* 에러 */}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
              <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs">이미지를 불러올 수 없습니다</p>
            </div>
          )}

          <img
            src={src}
            alt="영수증"
            className={`max-w-full max-h-[400px] object-contain cursor-zoom-in transition-opacity duration-300
              ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
            onClick={() => status === 'loaded' && setFullscreen(true)}
          />
        </div>

        {/* 확대 버튼 */}
        {status === 'loaded' && (
          <button
            onClick={() => setFullscreen(true)}
            className="w-full py-2.5 text-xs text-indigo-600 hover:bg-indigo-50 font-medium
                       flex items-center justify-center gap-1.5 transition-colors border-t border-gray-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            원본 크게 보기
          </button>
        )}
      </div>

      {/* 풀스크린 모달 */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={src}
            alt="영수증 원본"
            className="max-h-[90vh] max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
