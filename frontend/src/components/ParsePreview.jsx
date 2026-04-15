import { useState } from 'react'
import Badge from './Badge'

const CATEGORIES = ['식료품', '외식', '카페', '편의점', '의류', '의료', '교통', '문화/여가', '기타']
const PAYMENT_METHODS = ['신용카드', '체크카드', '현금', '간편결제', '기타']

function fmt(n) {
  return (n ?? 0).toLocaleString('ko-KR')
}

// ── 인라인 필드 레이블 ─────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

// ── 공통 인풋 스타일 ──────────────────────────────────────────
const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition'

export default function ParsePreview({ data, onSave, onCancel, isSaving = false }) {
  const [form, setForm] = useState(() => ({
    ...data,
    items: data.items ?? [],
    discount: data.discount ?? 0,
    tax: data.tax ?? 0,
  }))

  // ── 단일 필드 업데이트 ──────────────────────────────────────
  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  // ── 품목 행 업데이트 ────────────────────────────────────────
  const updateItem = (idx, field, raw) => {
    const value = ['quantity', 'unit_price'].includes(field)
      ? parseInt(raw, 10) || 0
      : raw

    setForm((prev) => {
      const items = prev.items.map((item, i) => {
        if (i !== idx) return item
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unit_price') {
          updated.total_price =
            (field === 'quantity' ? value : item.quantity) *
            (field === 'unit_price' ? value : item.unit_price)
        }
        return updated
      })
      return { ...prev, items }
    })
  }

  const addItem = () =>
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unit_price: 0, total_price: 0 }],
    }))

  const removeItem = (idx) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))

  // ── 소계 자동 계산 ──────────────────────────────────────────
  const computedSubtotal = form.items.reduce((s, it) => s + (it.total_price ?? 0), 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {/* 헤더 바 */}
      <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-base">파싱 결과 확인</h2>
          <p className="text-indigo-200 text-xs mt-0.5">필드를 수정한 후 저장하세요</p>
        </div>
        <Badge category={form.category} />
      </div>

      <div className="p-6 space-y-6">
        {/* ── 기본 정보 ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="상호명 *">
            <input
              className={inputCls}
              value={form.store_name ?? ''}
              onChange={(e) => update('store_name', e.target.value)}
              placeholder="가게 이름"
            />
          </Field>

          <Field label="카테고리">
            <select
              className={inputCls}
              value={form.category ?? '기타'}
              onChange={(e) => update('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="날짜 *">
            <input
              type="date"
              className={inputCls}
              value={form.receipt_date ?? ''}
              onChange={(e) => update('receipt_date', e.target.value)}
            />
          </Field>

          <Field label="시각">
            <input
              type="time"
              className={inputCls}
              value={form.receipt_time ?? ''}
              onChange={(e) => update('receipt_time', e.target.value)}
            />
          </Field>

          <Field label="결제 수단">
            <select
              className={inputCls}
              value={form.payment_method ?? '기타'}
              onChange={(e) => update('payment_method', e.target.value)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* ── 품목 목록 ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">품목</h3>
            <button
              onClick={addItem}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
            >
              <span className="text-base leading-none">+</span> 항목 추가
            </button>
          </div>

          {form.items.length > 0 ? (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {/* 테이블 헤더 */}
              <div className="grid grid-cols-[1fr_60px_90px_90px_32px] gap-2 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                <span>품명</span>
                <span className="text-right">수량</span>
                <span className="text-right">단가</span>
                <span className="text-right">합계</span>
                <span />
              </div>

              {/* 품목 행 */}
              {form.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_60px_90px_90px_32px] gap-2 px-3 py-2 border-t border-gray-100 items-center"
                >
                  <input
                    className="text-sm border-0 bg-transparent focus:outline-none focus:bg-indigo-50 rounded px-1 py-0.5 w-full"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    placeholder="품명"
                  />
                  <input
                    type="number"
                    min="1"
                    className="text-sm text-right border-0 bg-transparent focus:outline-none focus:bg-indigo-50 rounded px-1 py-0.5 w-full tabular-nums"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    className="text-sm text-right border-0 bg-transparent focus:outline-none focus:bg-indigo-50 rounded px-1 py-0.5 w-full tabular-nums"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                  />
                  <span className="text-sm text-right tabular-nums text-gray-700">
                    {fmt(item.total_price)}
                  </span>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              품목이 없습니다
            </p>
          )}
        </div>

        {/* ── 금액 요약 ── */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>소계</span>
            <span className="tabular-nums">{fmt(computedSubtotal)}원</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600 items-center gap-4">
            <span>할인</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-xs">−</span>
              <input
                type="number"
                min="0"
                className="w-28 text-right text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 tabular-nums"
                value={form.discount ?? 0}
                onChange={(e) => update('discount', parseInt(e.target.value, 10) || 0)}
              />
              <span className="text-xs text-gray-400">원</span>
            </div>
          </div>

          <div className="flex justify-between text-sm text-gray-600 items-center gap-4">
            <span>세금</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                className="w-28 text-right text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 tabular-nums"
                value={form.tax ?? 0}
                onChange={(e) => update('tax', parseInt(e.target.value, 10) || 0)}
              />
              <span className="text-xs text-gray-400">원</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-900">최종 결제</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                className="w-32 text-right text-xl font-bold text-indigo-700 border-0 bg-transparent focus:outline-none focus:bg-indigo-50 rounded px-1 tabular-nums"
                value={form.total_amount ?? 0}
                onChange={(e) => update('total_amount', parseInt(e.target.value, 10) || 0)}
              />
              <span className="text-sm font-semibold text-indigo-700">원</span>
            </div>
          </div>
        </div>

        {/* ── 저장 / 취소 ── */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onSave(form)}
            disabled={isSaving || !form.store_name || !form.receipt_date}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                저장 중…
              </>
            ) : (
              '저장'
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="px-6 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
