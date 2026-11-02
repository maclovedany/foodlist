# 상품 관리

Supabase의 상품을 조회, 검색, 추가, 삭제하는 로컬 전용 웹페이지.

## 실행

1. `.env.example`을 `.env.local`로 복사하고 Supabase URL과 키를 채운다
2. `npm install`
3. `npm run dev`
4. http://127.0.0.1:5173 접속

## 구조

- `src/`: React 화면
- `server/index.js`: DB에 접속하는 API 서버. 127.0.0.1:3001에서만 열린다

`SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회하는 전체 권한 키이므로 `.env.local` 밖에 적지 않는다.
`SUPABASE_ANON_KEY`는 현재 코드에서 쓰지 않는다.
