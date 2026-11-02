import { useState } from 'react'
import { GUIDE_TYPES, crossContamination, formatPrice } from './product.js'

function Row({ label, children }) {
  return (
    <div className="label-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export default function ProductLabel({ product, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const crossGuides = crossContamination(product)
  const showAllergyBox = product.allergens !== '없음' || crossGuides.length > 0
  const otherGuides = GUIDE_TYPES.filter((type) => type !== '교차오염주의')
    .map((type) => [type, product.guides.filter((guide) => guide.guide_type === type)])
    .filter(([, guides]) => guides.length > 0)

  async function confirmDelete() {
    setDeleting(true)
    setError('')
    try {
      await onDelete(product)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <article className="label">
      <h2>{product.name}</h2>
      <dl>
        <Row label="상품코드">{product.product_code}</Row>
        <Row label="중량용량">{product.pack_count ? `${product.size}, ${product.pack_count}` : product.size}</Row>
        <Row label="판매가">{formatPrice(product.price)}</Row>
        <Row label="원재료">{product.ingredients}</Row>
        <Row label="원산지">{product.origin ?? '미입력'}</Row>
        <Row label="보관기간">{product.storage_period ?? '미입력'}</Row>
        {!showAllergyBox && <Row label="알레르기">없음</Row>}
        {otherGuides.map(([type, guides]) => (
          <Row key={type} label={type}>
            {guides.length === 1 ? guides[0].content : (
              <ul>{guides.map((guide) => <li key={guide.id}>{guide.content}</li>)}</ul>
            )}
          </Row>
        ))}
        <Row label="상품특징">{product.description}</Row>
      </dl>

      {showAllergyBox && (
        <div className="allergy-box">
          <p><strong>알레르기</strong> {product.allergens}</p>
          {crossGuides.map((guide) => (
            <p key={guide.id}><strong>교차오염주의</strong> {guide.content}</p>
          ))}
        </div>
      )}

      <footer className="label-actions">
        {!confirming && (
          <button type="button" className="button-quiet-danger" onClick={() => setConfirming(true)}>상품 삭제</button>
        )}
        {confirming && (
          <div className="confirm" role="alertdialog" aria-label="상품 삭제 확인">
            <p>
              {product.product_code} {product.name} 상품과 안내 {product.guides.length}건을 삭제합니다.
              삭제하면 되돌릴 수 없습니다.
            </p>
            <div className="button-group">
              <button type="button" className="button-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? '삭제 중' : '삭제'}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={deleting}>취소</button>
            </div>
          </div>
        )}
        {error && <p className="field-error" role="alert">{error}</p>}
      </footer>
    </article>
  )
}
