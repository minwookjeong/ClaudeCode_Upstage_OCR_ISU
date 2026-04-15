import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 60_000, // OCR 파싱은 최대 60초 허용
})

// 응답 인터셉터 — 네트워크 오류 메시지 한국어 통일
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.message = '서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.'
    }
    return Promise.reject(error)
  }
)

export default api
