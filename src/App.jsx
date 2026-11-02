import { useCallback, useEffect, useMemo, useState } from 'react'
import { createProduct, deleteProduct, fetchProducts } from './api.js'
import { allergyNotice, formatPrice, matchesQuery } from './product.js'
import ProductForm from './ProductForm.jsx'
import ProductLabel from './ProductLabel.jsx'

export default function App() {
  const [products, setProducts] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedCode, setSelectedCode] = useState(null)
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    try {
      setProducts(await fetchProducts())
      setLoadError('')
    } catch (err) {
      setLoadError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(
    () => (products ?? []).filter((product) => matchesQuery(product, query)),
    [products, query],
  )
  const selected = products?.find((product) => product.product_code === selectedCode) ?? null

  function select(code) {
    setSelectedCode(code)
    setAdding(false)
    setNotice('')
  }

  function startAdding() {
    setAdding(true)
    setNotice('')
  }

  async function handleCreate(product) {
    await createProduct(product)
    await load()
    setAdding(false)
    // 검색어에 가려 새 상품이 안 보이는 일이 없도록 비운다
    setQuery('')
    setSelectedCode(product.product_code)
    setNotice(`${product.product_code} ${product.name} 상품을 추가했습니다.`)
  }

  async function handleDelete(product) {
    await deleteProduct(product.product_code)
    await load()
    setSelectedCode(null)
    setNotice(`${product.product_code} ${product.name} 상품을 삭제했습니다.`)
  }

  return (
    <div className="app">
      <section className="list-pane" aria-label="상품 목록">
        <header className="list-head">
          <h1>상품 관리</h1>
          <button type="button" className="button-primary" onClick={startAdding}>상품 추가</button>
        </header>

        <label className="search">
          <span>검색</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="코드, 상품명, 원재료, 알레르기, 안내 내용"
          />
        </label>

        {loadError && (
          <div className="message message-error" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={load}>다시 불러오기</button>
          </div>
        )}
        {products && !loadError && (
          <p className="count" aria-live="polite">{visible.length}개 표시 / 전체 {products.length}개</p>
        )}
        {products === null && !loadError && <p className="count">상품을 불러오는 중입니다.</p>}
        {products?.length === 0 && <p className="empty">등록된 상품이 없습니다. 상품 추가를 눌러 등록하세요.</p>}
        {products?.length > 0 && visible.length === 0 && (
          <p className="empty">"{query}"와 일치하는 상품이 없습니다.</p>
        )}

        <ul className="product-list">
          {visible.map((product) => {
            const warning = allergyNotice(product)
            return (
              <li key={product.product_code}>
                <button
                  type="button"
                  className="product-row"
                  aria-current={!adding && selectedCode === product.product_code ? 'true' : undefined}
                  onClick={() => select(product.product_code)}
                >
                  <span className="row-code">{product.product_code}</span>
                  <span className="row-name">{product.name}</span>
                  <span className="row-price">{formatPrice(product.price)}</span>
                  {warning && <span className="row-warning">{warning}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <main className="detail-pane">
        {notice && <p className="message message-ok" role="status">{notice}</p>}
        {adding && (
          <ProductForm
            existingCodes={(products ?? []).map((product) => product.product_code)}
            onSubmit={handleCreate}
            onCancel={() => setAdding(false)}
          />
        )}
        {!adding && selected && (
          <ProductLabel key={selected.product_code} product={selected} onDelete={handleDelete} />
        )}
        {!adding && !selected && !notice && (
          <p className="empty">목록에서 상품을 고르면 표시사항이 여기에 나옵니다.</p>
        )}
      </main>
    </div>
  )
}
