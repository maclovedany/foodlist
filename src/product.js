// 서버의 GUIDE_TYPES, DB의 guide_type 제약과 같은 값을 유지한다
export const GUIDE_TYPES = ['개봉후보관', '보관금지', '보관주의', '교차오염주의', '섭취안내', '판매기간']

export const crossContamination = (product) =>
  product.guides.filter((guide) => guide.guide_type === '교차오염주의')

// 목록과 표시사항에서 같은 기준으로 알레르기 주의를 판단한다
export function allergyNotice(product) {
  if (product.allergens === '미확인') return '알레르기 미확인'
  if (product.allergens !== '없음') return `알레르기 ${product.allergens}`
  if (crossContamination(product).length > 0) return '교차오염 주의'
  return null
}

const compact = (text) => text.toLowerCase().replace(/\s+/g, '')

export function matchesQuery(product, query) {
  const needle = compact(query)
  if (!needle) return true
  const fields = [
    product.product_code, product.name, product.ingredients, product.origin,
    product.allergens, product.description, ...product.guides.map((guide) => guide.content),
  ]
  return fields.some((field) => field && compact(field).includes(needle))
}

export const formatPrice = (price) => `${price.toLocaleString('ko-KR')}원`
