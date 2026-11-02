import { useState } from 'react'
import { GUIDE_TYPES } from './product.js'

const EMPTY = {
  product_code: '', name: '', size: '', pack_count: '', price: '',
  ingredients: '', origin: '', storage_period: '', allergens: '', description: '',
}

function Field({ label, name, value, onChange, hint, required = true, ...rest }) {
  return (
    <label className="field">
      <span>{label}{!required && <em> 선택</em>}</span>
      <input name={name} value={value} onChange={onChange} required={required} {...rest} />
      {hint && <small>{hint}</small>}
    </label>
  )
}

export default function ProductForm({ existingCodes, onSubmit, onCancel }) {
  const [values, setValues] = useState(EMPTY)
  const [guides, setGuides] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const change = (event) => setValues({ ...values, [event.target.name]: event.target.value })
  const changeGuide = (index, key, value) =>
    setGuides(guides.map((guide, i) => (i === index ? { ...guide, [key]: value } : guide)))

  async function submit(event) {
    event.preventDefault()
    if (existingCodes.includes(values.product_code.trim())) {
      setError('이미 있는 상품코드입니다.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSubmit({ ...values, product_code: values.product_code.trim(), name: values.name.trim(), guides })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form className="label label-form" onSubmit={submit}>
      <h2>새 상품</h2>

      <div className="field-grid">
        <Field label="상품코드" name="product_code" value={values.product_code} onChange={change}
          pattern="P-[0-9]{4}" title="P-0000 형식" placeholder="P-0000" autoFocus />
        <Field label="상품명" name="name" value={values.name} onChange={change} />
        <Field label="중량용량" name="size" value={values.size} onChange={change} placeholder="500g" />
        <Field label="구성수량" name="pack_count" value={values.pack_count} onChange={change}
          required={false} placeholder="10개" />
        <Field label="판매가(원)" name="price" value={values.price} onChange={change}
          type="number" min="0" max="2147483647" step="1" />
        <Field label="원산지" name="origin" value={values.origin} onChange={change} required={false} />
        <Field label="원재료" name="ingredients" value={values.ingredients} onChange={change} />
        <Field label="보관기간" name="storage_period" value={values.storage_period} onChange={change}
          required={false} placeholder="냉장 10일" />
      </div>

      <div className="allergy-box">
        <Field label="알레르기" name="allergens" value={values.allergens} onChange={change}
          placeholder="밀, 대두" hint="유발 물질이 없으면 없음, 모르면 미확인으로 적습니다." />
      </div>

      <label className="field">
        <span>상품특징</span>
        <textarea name="description" value={values.description} onChange={change} required rows={3} />
      </label>

      <fieldset className="guides">
        <legend>안내<em> 선택</em></legend>
        {guides.map((guide, index) => (
          <div className="guide-row" key={index}>
            <select
              aria-label={`안내 ${index + 1} 유형`}
              value={guide.guide_type}
              onChange={(event) => changeGuide(index, 'guide_type', event.target.value)}
            >
              {GUIDE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input
              aria-label={`안내 ${index + 1} 내용`}
              value={guide.content}
              onChange={(event) => changeGuide(index, 'content', event.target.value)}
              required
            />
            <button type="button" onClick={() => setGuides(guides.filter((_, i) => i !== index))}
              aria-label={`안내 ${index + 1} 삭제`}>삭제</button>
          </div>
        ))}
        <button type="button" onClick={() => setGuides([...guides, { guide_type: GUIDE_TYPES[0], content: '' }])}>
          안내 추가
        </button>
      </fieldset>

      {error && <p className="message message-error" role="alert">{error}</p>}

      <footer className="button-group">
        <button type="submit" className="button-primary" disabled={saving}>{saving ? '저장 중' : '상품 저장'}</button>
        <button type="button" onClick={onCancel} disabled={saving}>취소</button>
      </footer>
    </form>
  )
}
