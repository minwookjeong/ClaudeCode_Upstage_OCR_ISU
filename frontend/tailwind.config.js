/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // PRD 10.2 컬러 팔레트 — 카테고리 뱃지
        category: {
          '식료품':   { bg: '#DCFCE7', text: '#15803D' }, // green-100 / green-700
          '외식':     { bg: '#FFEDD5', text: '#C2410C' }, // orange-100 / orange-700
          '교통':     { bg: '#DBEAFE', text: '#1D4ED8' }, // blue-100 / blue-700
          '쇼핑':     { bg: '#F3E8FF', text: '#7E22CE' }, // purple-100 / purple-700
          '의류':     { bg: '#F3E8FF', text: '#7E22CE' }, // purple-100 / purple-700
          '의료':     { bg: '#FEE2E2', text: '#B91C1C' }, // red-100 / red-700
          '카페':     { bg: '#FEF9C3', text: '#A16207' }, // yellow-100 / yellow-700
          '편의점':   { bg: '#E0E7FF', text: '#4338CA' }, // indigo-100 / indigo-700
          '문화/여가': { bg: '#FCE7F3', text: '#9D174D' }, // pink-100 / pink-700
          '기타':     { bg: '#F3F4F6', text: '#374151' }, // gray-100 / gray-700
        },
      },
      keyframes: {
        // Toast 진입 애니메이션
        'slide-in-right': {
          '0%':   { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        'fade-out': {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
        // ProgressBar 애니메이션
        'progress-indeterminate': {
          '0%':   { left: '-40%', width: '40%' },
          '60%':  { left: '60%',  width: '40%' },
          '100%': { left: '100%', width: '40%' },
        },
        // DropZone 강조
        'pulse-border': {
          '0%, 100%': { borderColor: '#6366F1' },  // indigo-500
          '50%':      { borderColor: '#A5B4FC' },  // indigo-300
        },
        // 카드 fade-in
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-right':         'slide-in-right 0.3s ease-out forwards',
        'fade-out':               'fade-out 0.4s ease-in forwards',
        'progress-indeterminate': 'progress-indeterminate 1.4s ease-in-out infinite',
        'pulse-border':           'pulse-border 1.5s ease-in-out infinite',
        'fade-in':                'fade-in 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
}
