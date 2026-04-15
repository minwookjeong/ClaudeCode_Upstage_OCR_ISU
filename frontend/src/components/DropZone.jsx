import { useRef, useState } from 'react'

const ACCEPT = '.jpg,.jpeg,.png,.pdf'
const MAX_MB = 10

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DropZone({ onFile, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null) // { url, name, size, isPdf }
  const [validationError, setValidationError] = useState(null)
  const inputRef = useRef(null)

  const validate = (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext)) {
      return `지원하지 않는 형식입니다 (.${ext}). JPG, PNG, PDF만 가능합니다.`
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `파일 크기가 ${MAX_MB}MB를 초과합니다 (${formatBytes(file.size)}).`
    }
    return null
  }

  const handleFile = (file) => {
    if (!file) return
    setValidationError(null)

    const err = validate(file)
    if (err) {
      setValidationError(err)
      return
    }

    const isPdf = file.name.toLowerCase().endsWith('.pdf')
    const url = isPdf ? null : URL.createObjectURL(file)
    setPreview({ url, name: file.name, size: formatBytes(file.size), isPdf })
    onFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    handleFile(e.dataTransfer.files[0])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleInputChange = (e) => {
    handleFile(e.target.files[0])
    // 같은 파일 재선택 허용
    e.target.value = ''
  }

  const reset = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
    setPreview(null)
    setValidationError(null)
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        className={[
          'relative flex flex-col items-center justify-center',
          'border-2 border-dashed rounded-2xl p-12 transition-all duration-200',
          'cursor-pointer select-none',
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            : isDragging
            ? 'border-indigo-500 bg-indigo-50 animate-pulse-border'
            : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/40',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />

        {preview ? (
          /* 파일 선택됨 — 미리보기 */
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            {preview.isPdf ? (
              <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <img
                src={preview.url}
                alt="영수증 미리보기"
                className="max-h-32 max-w-xs rounded-lg object-contain shadow-sm"
              />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{preview.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{preview.size}</p>
            </div>
            {!disabled && (
              <button
                onClick={(e) => { e.stopPropagation(); reset() }}
                className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
              >
                다른 파일 선택
              </button>
            )}
          </div>
        ) : (
          /* 파일 미선택 — 업로드 안내 */
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-indigo-100' : 'bg-gray-100'}`}>
              <svg className={`w-7 h-7 transition-colors ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-700">
                {isDragging ? '여기에 놓으세요' : '영수증을 드래그하거나 클릭하여 선택'}
              </p>
              <p className="text-sm text-gray-400 mt-1">JPG, PNG, PDF · 최대 {MAX_MB}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* 유효성 오류 */}
      {validationError && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <span>⚠</span> {validationError}
        </p>
      )}
    </div>
  )
}
