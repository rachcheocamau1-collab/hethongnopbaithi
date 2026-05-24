# Hệ thống nộp bài thi

Frontend: Vite + React. Backend: Vercel Serverless Functions trong `api/`. Storage: Neon (Postgres serverless).

## Deploy lên Vercel

1. Push code lên GitHub (đã có).
2. Vào https://vercel.com → **Add New… → Project** → import repo này.
3. Trong project, vào **Storage → Create Database → Neon** (Postgres). Chọn region gần (Singapore), plan **Free**, tắt **Auth**. Sau khi tạo, Vercel tự inject `DATABASE_URL` vào project.
4. **Deploy**. Lần đầu DB còn trống — app sẽ tự tạo bảng `kv`, seed `default-contest` và `adminPasscode = admin123` ở request đầu.
5. Mở URL → login admin bằng `admin123` → **đổi mật khẩu ngay** trong Manager Dashboard.

## Phát triển local

```bash
npm install
npm run dev          # chỉ chạy frontend (Vite), /api/* sẽ 404
```

Để chạy full-stack local (gồm cả `api/*`):

```bash
npm i -g vercel
vercel link          # liên kết với project Vercel
vercel env pull      # tải DATABASE_URL xuống .env.local
vercel dev           # chạy frontend + serverless functions cùng lúc
```

## Cấu trúc

- `src/` — React app
- `api/` — Vercel serverless functions
  - `_lib/store.ts` — Neon Postgres helpers (table `kv` với key/value JSONB)
  - `_lib/types.ts` — types dùng chung
  - `reports/`, `contests/`, `admin/`, `download/`
- `vite.config.ts` — config Vite (frontend)

## Lưu ý

- **Giới hạn upload**: serverless function trên Hobby plan tối đa ~4MB body. File lớn hơn sẽ fail. Nếu cần upload to hơn, chuyển sang **Vercel Blob**.
- **Reset toàn bộ data**: vào Neon dashboard → SQL Editor → `DELETE FROM kv;` (hoặc xoá từng key).
- Mật mã admin mặc định: `admin123` (sửa được trong UI, lưu vào DB).
