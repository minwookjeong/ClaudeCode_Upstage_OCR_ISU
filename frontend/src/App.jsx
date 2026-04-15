import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ExpenseDetail from './pages/ExpenseDetail'
import UploadPage from './pages/UploadPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 메인 대시보드 */}
        <Route path="/" element={<Dashboard />} />

        {/* 영수증 업로드 */}
        <Route path="/upload" element={<UploadPage />} />

        {/* 지출 상세/수정 */}
        <Route path="/expense/:id" element={<ExpenseDetail />} />

        {/* 알 수 없는 경로 → 대시보드로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
