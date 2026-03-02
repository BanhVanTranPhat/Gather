# Polyfills & Shims – Rà soát

## Đang dùng

### Polyfills
- **`src/polyfills/module.ts`** – Import đầu tiên trong `main.tsx`. Cung cấp `globalThis.module` / `module.exports` cho thư viện CJS (nếu cần).
- **`src/polyfills/globalThis.ts`** – Dùng qua alias Vite `globalThis` → file này. Đảm bảo `global`/globalThis có sẵn.

### Shims (alias Vite)
- **`src/shims/react-icons-fa.tsx`** – Alias `react-icons/fa` → file này (giảm bundle / tránh lỗi default export).
- **`src/shims/react-icons-fc.tsx`** – Alias `react-icons/fc` → file này.

---

## Đã xóa (cleanup)

Các file sau đã được xóa vì không còn được import; project dùng SFU (mediasoup) thay cho simple-peer.

### Polyfills đã xóa
- `process.ts`, `stream.ts`, `events.ts`, `util.ts`, `string_decoder.ts`, `inherits.ts`, `util_deprecate.ts` (và bản `.js`)

### Shims đã xóa
- `jsx-runtime.ts`, `react-oauth-google.tsx`, `events.js`
