import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import DropZone from '../components/DropZone'
import Header from '../components/Header'
import ParsePreview from '../components/ParsePreview'
import ProgressBar from '../components/ProgressBar'
import { useToast } from '../contexts/ToastContext'

// ── localStorage 동기화 헬퍼 ──────────────────────────────────
function syncLocalStorage(expense) {
  try {
    const stored = JSON.parse(localStorage.getItem('expenses') || '[]')
    const idx = stored.findIndex((e) => e.id === expense.id)
    if (idx >= 0) {
      stored[idx] = expense
    } else {
      stored.unshift(expense)
    }
    localStorage.setItem('expenses', JSON.stringify(stored))
  } catch {
    // localStorage 접근 불가 환경 무시
  }
}

// ── 업로드 상태 머신 ──────────────────────────────────────────
const STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PREVIEW: 'preview',
  SAVING: 'saving',
  ERROR: 'error',
}

export default function UploadPage() {
  const navigate = useNavigate()
  const showToast = useToast()

  const [status, setStatus] = useState(STATUS.IDLE)
  const [parsedData, setParsedData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // ── 파일 선택 → OCR 업로드 ────────────────────────────────
  const handleFile = async (file) => {
    setStatus(STATUS.UPLOADING)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setParsedData(data)
      setStatus(STATUS.PREVIEW)
    } catch (err) {
      const detail =
        err.response?.data?.detail ??
        err.message ??
        'OCR 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'
      setErrorMsg(detail)
      setStatus(STATUS.ERROR)
    }
  }

  // ── ParsePreview 저장 ─────────────────────────────────────
  const handleSave = async (formData) => {
    setStatus(STATUS.SAVING)
    try {
      const { data: updated } = await api.put(
        `/api/expenses/${parsedData.id}`,
        formData,
      )
      syncLocalStorage(updated)
      showToast('지출 내역이 저장되었습니다.', 'success')
      navigate('/')
    } catch (err) {
      const detail =
        err.response?.data?.detail ?? err.message ?? '저장에 실패했습니다.'
      showToast(detail, 'error')
      setStatus(STATUS.PREVIEW)
    }
  }

  // ── 취소 — 업로드된 항목은 그대로 두고 대시보드로 이동 ──────
  const handleCancel = () => {
    if (parsedData) {
      syncLocalStorage(parsedData) // 원본 OCR 결과 그대로 저장
    }
    navigate('/')
  }

  // ── 재시도 ────────────────────────────────────────────────
  const handleRetry = () => {
    setParsedData(null)
    setErrorMsg('')
    setStatus(STATUS.IDLE)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* 페이지 타이틀 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">영수증 업로드</h1>
          <p className="text-sm text-gray-500 mt-1">
            영수증 이미지를 업로드하면 AI가 자동으로 내용을 분석합니다
          </p>
        </div>

        {/* ── IDLE / UPLOADING — DropZone + ProgressBar ── */}
        {(status === STATUS.IDLE || status === STATUS.UPLOADING) && (
          <div className="space-y-4">
            <DropZone
              onFile={handleFile}
              disabled={status === STATUS.UPLOADING}
            />
            <ProgressBar visible={status === STATUS.UPLOADING} />
          </div>
        )}

        {/* ── PREVIEW / SAVING — 파싱 결과 편집 ── */}
        {(status === STATUS.PREVIEW || status === STATUS.SAVING) && parsedData && (
          <ParsePreview
            data={parsedData}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={status === STATUS.SAVING}
          />
        )}

        {/* ── ERROR — 오류 배너 + 재시도 ── */}
        {status === STATUS.ERROR && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-700">OCR 처리 실패</h3>
                <p className="text-sm text-red-600 mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                다시 시도
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-colors text-sm"
              >
                대시보드로
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
