# Load Test – Chứng minh scalability

Script spawn N client Socket.IO, join cùng một room, gửi message và đo latency (client gửi → client nhận broadcast).

## Chạy

1. **Bật backend** (ví dụ `cd backend && npm run dev`).
2. Trong thư mục `backend`:

```bash
npm run load-test
```

## Biến môi trường

| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `SERVER_URL` | `http://localhost:5001` | URL backend |
| `ROOM_ID` | `loadtest-room` | Room tất cả client join |
| `N_CLIENTS` | `15` | Số client (tối đa 25) |
| `MESSAGES_PER_CLIENT` | `5` | Số message mỗi client |
| `DELAY_MS` | `800` | Khoảng cách giữa 2 message (ms) |

Ví dụ:

```bash
SERVER_URL=http://localhost:5001 ROOM_ID=my-room N_CLIENTS=20 npm run load-test
```

## Kết quả

- In ra console: total time, số message đã ack, số lỗi, **latency (min, max, avg, p95, p99)**.
- Ghi file **`LOAD_TEST_RESULT.csv`** (cùng thư mục với lệnh chạy) với một dòng: timestamp, roomId, nClients, messagesCount, errorsCount, avgMs, p95Ms, p99Ms, totalMs.

Dùng số liệu này làm evidence cho “≥20 users per channel” và độ trễ chấp nhận được.
