# Polyfills & Shims – Rà soát Bước 6

## Đang dùng

### Polyfills
- **`src/polyfills/module.ts`** – Import đầu tiên trong `main.tsx`. Cung cấp `globalThis.module` / `module.exports` cho thư viện CJS (nếu cần).
- **`src/polyfills/globalThis.ts`** – Dùng qua alias Vite `globalThis` → file này. Đảm bảo `global`/globalThis có sẵn.

### Shims (alias Vite)
- **`src/shims/react-icons-fa.tsx`** – Alias `react-icons/fa` → file này (giảm bundle / tránh lỗi default export).
- **`src/shims/react-icons-fc.tsx`** – Alias `react-icons/fc` → file này.

---

## Không còn được import trực tiếp

Các file sau **không** được import trong source; giữ lại làm backup hoặc cho dependency (ví dụ mediasoup) nếu cần tại runtime.

### Polyfills
- `process.ts`, `stream.ts`, `events.ts`, `util.ts`, `string_decoder.ts`, `inherits.ts`, `util_deprecate.ts` (và bản `.js` nếu có)  
- Trước đây dùng cho simple-peer; hiện chỉ SFU (mediasoup). Vite đã `define: { "process.browser": "true" }`. Nếu build chạy ổn thì có thể không cần các file này.

### Shims
- **`src/shims/jsx-runtime.ts`** – Không có alias trỏ tới; app dùng `react/jsx-runtime` mặc định. Có thể xóa nếu không dùng.
- **`src/shims/react-oauth-google.tsx`** – App dùng package `@react-oauth/google` thật; shim này không còn dùng. Giữ làm backup nếu cần fallback.
- **`src/shims/events.js`** – Không thấy import. Có thể xóa nếu không dùng.

---

## Gợi ý

- **Giữ:** `polyfills/module.ts`, `polyfills/globalThis.ts`, `shims/react-icons-fa.tsx`, `shims/react-icons-fc.tsx`.
- **Có thể xóa (sau khi test build + vài flow):** `shims/jsx-runtime.ts`, `shims/react-oauth-google.tsx`, `shims/events.js`, và toàn bộ polyfill không dùng (process, stream, events, util, …). Nên xóa từng bước và chạy `pnpm run build` + test trước khi xóa tiếp.
