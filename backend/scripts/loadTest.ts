/**
 * Load simulation: spawn N Socket.IO clients, join room, send messages, measure latency.
 * Chứng minh scalability (≥20 users) với số liệu đo được.
 *
 * Usage:
 *   SERVER_URL=http://localhost:5001 ROOM_ID=test-room N_CLIENTS=15 npx tsx scripts/loadTest.ts
 *
 * Output: in-memory stats + optional CSV (LOAD_TEST_RESULT.csv)
 */

import { io as ioClient, Socket } from "socket.io-client";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:5001";
const ROOM_ID = process.env.ROOM_ID || "loadtest-room";
const N_CLIENTS = Math.min(parseInt(process.env.N_CLIENTS || "15", 10), 25);
const MESSAGES_PER_CLIENT = parseInt(process.env.MESSAGES_PER_CLIENT || "5", 10);
const DELAY_MS = parseInt(process.env.DELAY_MS || "800", 10);

const PREFIX = "loadtest-";

interface LatencySample {
  sendTime: number;
  receivedTime: number;
  latencyMs: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, i)];
}

async function runOneClient(
  index: number,
  roomId: string,
  latencies: LatencySample[],
  errors: string[]
): Promise<void> {
  const userId = `loadtest-user-${index}`;
  const username = `LoadUser${index}`;

  return new Promise((resolve, reject) => {
    const socket: Socket = ioClient(SERVER_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
    });

    let joined = false;
    let messagesSent = 0;
    let pending = 0;

    const timeout = setTimeout(() => {
      if (!joined) errors.push(`Client ${index}: join timeout`);
      if (pending > 0) errors.push(`Client ${index}: ${pending} messages not acked`);
      socket.disconnect();
      resolve();
    }, 30000);

    socket.on("connect", () => {
      socket.emit("user-join", {
        userId,
        username,
        roomId,
        position: { x: 100 + index * 20, y: 100 },
      });
    });

    socket.on("app-error", (data: { message?: string }) => {
      errors.push(`Client ${index}: ${data.message || "app-error"}`);
    });

    socket.on("room-full", () => {
      errors.push(`Client ${index}: room full`);
      clearTimeout(timeout);
      socket.disconnect();
      resolve();
    });

    socket.on("user-joined", () => {});
    socket.on("room-users", () => {});

    socket.on("room-info", () => {
      if (!joined) {
        joined = true;
        setTimeout(sendNext, 100);
      }
    });

    socket.on("chat-message", (data: { message?: string; content?: string }) => {
      const content = (data.message || data.content || "").toString();
      if (!content.startsWith(PREFIX)) return;
      const sendTime = parseInt(content.slice(PREFIX.length), 10);
      if (!Number.isFinite(sendTime)) return;
      const receivedTime = Date.now();
      latencies.push({ sendTime, receivedTime, latencyMs: receivedTime - sendTime });
      pending -= 1;
    });

    socket.on("connect_error", (err) => {
      errors.push(`Client ${index}: connect_error ${err.message}`);
      clearTimeout(timeout);
      resolve();
    });

    socket.on("disconnect", (reason) => {
      if (joined && messagesSent < MESSAGES_PER_CLIENT) {
        errors.push(`Client ${index}: disconnected (${reason}) before sending all`);
      }
    });

    const sendNext = () => {
      if (messagesSent >= MESSAGES_PER_CLIENT || !joined) {
        if (pending === 0) {
          clearTimeout(timeout);
          socket.disconnect();
          resolve();
        }
        return;
      }
      const sendTime = Date.now();
      const payload = `${PREFIX}${sendTime}`;
      socket.emit("chat-message", { message: payload, type: "global" });
      messagesSent += 1;
      pending += 1;
      setTimeout(sendNext, DELAY_MS);
    };

  });
}

async function main(): Promise<void> {
  // Quick health check before spawning clients
  try {
    const res = await fetch(`${SERVER_URL}/api/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  } catch (err) {
    console.error("Cannot reach server at", SERVER_URL);
    console.error("Error:", (err as Error).message);
    console.error("\n→ Đảm bảo backend đang chạy: cd backend && npm run dev");
    process.exit(1);
  }

  console.log("Load test config:", {
    SERVER_URL,
    ROOM_ID,
    N_CLIENTS,
    MESSAGES_PER_CLIENT,
    DELAY_MS,
  });
  console.log("Connecting", N_CLIENTS, "clients...\n");

  const latencies: LatencySample[] = [];
  const errors: string[] = [];

  const start = Date.now();
  await Promise.all(
    Array.from({ length: N_CLIENTS }, (_, i) => runOneClient(i + 1, ROOM_ID, latencies, errors))
  );
  const totalMs = Date.now() - start;

  const sorted = latencies.map((s) => s.latencyMs).sort((a, b) => a - b);
  const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  const p95 = percentile(sorted, 95);
  const p99 = percentile(sorted, 99);

  console.log("--- Results ---");
  console.log("Total time (ms):", totalMs);
  console.log("Clients:", N_CLIENTS);
  console.log("Messages sent (with ack):", latencies.length);
  console.log("Errors:", errors.length);
  if (errors.length > 0 && errors.length <= 10) {
    errors.forEach((e) => console.log("  ", e));
  } else if (errors.length > 10) {
    errors.slice(0, 5).forEach((e) => console.log("  ", e));
    console.log("  ... and", errors.length - 5, "more");
  }
  console.log("\nLatency (ms):");
  console.log("  min:", sorted[0] ?? "—");
  console.log("  max:", sorted[sorted.length - 1] ?? "—");
  console.log("  avg:", Math.round(avg));
  console.log("  p95:", p95);
  console.log("  p99:", p99);

  const csvPath = "LOAD_TEST_RESULT.csv";
  const fs = await import("fs");
  const csv =
    "timestamp,roomId,nClients,messagesCount,errorsCount,avgMs,p95Ms,p99Ms,totalMs\n" +
    `${new Date().toISOString()},${ROOM_ID},${N_CLIENTS},${latencies.length},${errors.length},${Math.round(avg)},${p95},${p99},${totalMs}\n`;
  fs.writeFileSync(csvPath, csv, "utf8");
  console.log("\nWrote", csvPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
