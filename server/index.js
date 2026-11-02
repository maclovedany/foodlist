// 내 PC에서만 도는 API 서버. Supabase 키는 여기에만 두고 브라우저로 보내지 않는다
import { existsSync } from 'node:fs'
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const ENV_FILE = new URL('../.env.local', import.meta.url)
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)

const PORT = 3001
const HOST = '127.0.0.1'
const GUIDE_TYPES = ['개봉후보관', '보관금지', '보관주의', '교차오염주의', '섭취안내', '판매기간']

const SETUP_MESSAGE = '.env.local의 SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 비어 있거나 형식이 올바르지 않습니다. 값을 고친 뒤 npm run dev를 다시 실행하세요.'

// 접속 정보에 문제가 있어도 서버는 켜 두고 화면에서 안내한다
function createSupabase() {
  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('값 없음')
    // 테이블에 RLS 정책이 없으므로 RLS를 우회하는 service role 키로 접속한다
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  } catch {
    console.error(SETUP_MESSAGE)
    return null
  }
}

const supabase = createSupabase()

const app = express()

// 다른 사이트가 localhost로 위장해 요청하는 것을 막는다
app.use((req, res, next) => {
  const host = (req.hostname ?? '').toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1') return next()
  res.status(403).json({ error: '내 PC에서만 접속할 수 있습니다.' })
})
app.use(express.json())
app.use('/api', (req, res, next) => {
  if (supabase) return next()
  res.status(503).json({ error: SETUP_MESSAGE })
})

const asText = (value) => (typeof value === 'string' ? value.trim() : '')

function parseProduct(body) {
  const product = {
    product_code: asText(body?.product_code),
    name: asText(body?.name),
    size: asText(body?.size),
    pack_count: asText(body?.pack_count) || null,
    price: Number(body?.price),
    ingredients: asText(body?.ingredients),
    origin: asText(body?.origin) || null,
    storage_period: asText(body?.storage_period) || null,
    allergens: asText(body?.allergens),
    description: asText(body?.description),
  }
  const guides = (Array.isArray(body?.guides) ? body.guides : []).map((guide) => ({
    guide_type: asText(guide?.guide_type),
    content: asText(guide?.content),
  }))

  if (!/^P-[0-9]{4}$/.test(product.product_code)) return { error: '상품코드는 P-0000 형식으로 입력하세요.' }
  if (!product.name) return { error: '상품명을 입력하세요.' }
  if (!product.size) return { error: '중량용량을 입력하세요.' }
  if (!Number.isInteger(product.price) || product.price < 0 || product.price > 2147483647) {
    return { error: '판매가는 0 이상의 정수로 입력하세요.' }
  }
  if (!product.ingredients) return { error: '원재료를 입력하세요.' }
  if (!product.allergens) return { error: '알레르기를 입력하세요. 유발 물질이 없으면 없음, 모르면 미확인으로 적습니다.' }
  if (!product.description) return { error: '상품특징을 입력하세요.' }
  if (guides.some((guide) => !GUIDE_TYPES.includes(guide.guide_type) || !guide.content)) {
    return { error: '안내는 유형과 내용을 모두 입력하세요.' }
  }
  return { product, guides }
}

app.get('/api/products', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, guides:product_guides(id, guide_type, content)')
      .order('product_code')
    if (error) throw error
    for (const product of data) product.guides.sort((a, b) => a.id - b.id)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

app.post('/api/products', async (req, res, next) => {
  const parsed = parseProduct(req.body)
  if (parsed.error) return res.status(400).json({ error: parsed.error })
  const { product, guides } = parsed

  try {
    const { error: productError } = await supabase.from('products').insert(product)
    if (productError?.code === '23505') return res.status(409).json({ error: '이미 있는 상품코드입니다.' })
    if (productError) throw productError

    if (guides.length > 0) {
      const rows = guides.map((guide) => ({ ...guide, product_code: product.product_code }))
      const { error: guideError } = await supabase.from('product_guides').insert(rows)
      if (guideError) {
        // 두 번의 요청이라 트랜잭션이 없으므로 먼저 넣은 상품을 직접 되돌린다
        const { error: rollbackError } = await supabase.from('products').delete().eq('product_code', product.product_code)
        if (rollbackError) console.error('상품 되돌리기 실패:', product.product_code, rollbackError.message)
        if (guideError.code === '23505') return res.status(409).json({ error: '같은 안내가 두 번 입력되었습니다.' })
        throw guideError
      }
    }
    res.status(201).json({ product_code: product.product_code })
  } catch (err) {
    next(err)
  }
})

app.delete('/api/products/:code', async (req, res, next) => {
  try {
    // 연결된 안내는 외래키의 on delete cascade로 함께 지워진다
    const { error, count } = await supabase
      .from('products')
      .delete({ count: 'exact' })
      .eq('product_code', req.params.code)
    if (error) throw error
    if (count === 0) return res.status(404).json({ error: '이미 삭제된 상품입니다.' })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: '요청 형식이 올바르지 않습니다.' })
  console.error(err.code ?? '', err.message)
  if (err.code === 'PGRST205' || err.code === '42P01') {
    return res.status(503).json({ error: 'Supabase에 상품 테이블이 없습니다. product_db_schema.sql을 먼저 실행하세요.' })
  }
  res.status(503).json({ error: 'Supabase에 연결하지 못했습니다. .env.local의 URL과 키를 확인하세요.' })
})

app.listen(PORT, HOST, () => console.log(`API 서버: http://${HOST}:${PORT}`))
