# 상품 관리

Supabase의 상품을 조회, 검색, 추가, 삭제하는 웹페이지. 로컬과 Vercel에서 실행한다.

로그인이 없다. 배포 주소를 아는 사람은 누구나 상품을 추가하고 삭제할 수 있다.

## 실행

1. `.env.example`을 `.env.local`로 복사하고 Supabase URL과 키를 채운다
2. `npm install`
3. `npm run dev`
4. http://127.0.0.1:5173 접속

## Vercel 배포

환경변수에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 넣는다. 이름에 `VITE_`를 붙이지 않는다.

## 구조

- `src/`: React 화면
- `server/app.js`: DB에 접속하는 API
- `server/index.js`: 로컬 실행용. 127.0.0.1:3001에서만 열린다
- `api/index.js`, `vercel.json`: Vercel에서 `/api` 요청을 `server/app.js`로 보낸다

`SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회하는 전체 권한 키이므로 `.env.local` 밖에 적지 않는다.
`SUPABASE_ANON_KEY`는 현재 코드에서 쓰지 않는다.
