// 로컬 개발용 진입점. 내 PC에서만 열린다
import { existsSync } from 'node:fs'
import express from 'express'

const ENV_FILE = new URL('../.env.local', import.meta.url)
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE)

// app.js가 불러오는 시점에 환경변수를 읽으므로 .env.local을 먼저 읽고 불러온다
const { default: app } = await import('./app.js')

const PORT = 3001
const HOST = '127.0.0.1'

const local = express()

// 다른 사이트가 localhost로 위장해 요청하는 것을 막는다
local.use((req, res, next) => {
  const host = (req.hostname ?? '').toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1') return next()
  res.status(403).json({ error: '내 PC에서만 접속할 수 있습니다.' })
})
local.use(app)

local.listen(PORT, HOST, () => console.log(`API 서버: http://${HOST}:${PORT}`))
