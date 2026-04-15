// PRD 10.2 카테고리 뱃지 색상 팔레트
const STYLES = {
  식료품:    { backgroundColor: '#DCFCE7', color: '#15803D' },
  외식:      { backgroundColor: '#FFEDD5', color: '#C2410C' },
  카페:      { backgroundColor: '#FEF9C3', color: '#A16207' },
  편의점:    { backgroundColor: '#E0E7FF', color: '#4338CA' },
  의류:      { backgroundColor: '#F3E8FF', color: '#7E22CE' },
  쇼핑:      { backgroundColor: '#F3E8FF', color: '#7E22CE' },
  의료:      { backgroundColor: '#FEE2E2', color: '#B91C1C' },
  교통:      { backgroundColor: '#DBEAFE', color: '#1D4ED8' },
  '문화/여가': { backgroundColor: '#FCE7F3', color: '#9D174D' },
  기타:      { backgroundColor: '#F3F4F6', color: '#374151' },
}

export default function Badge({ category }) {
  const label = category || '기타'
  const style = STYLES[label] ?? STYLES['기타']

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={style}
    >
      {label}
    </span>
  )
}
