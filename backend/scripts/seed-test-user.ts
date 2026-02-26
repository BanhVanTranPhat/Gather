/**
 * Seed Test User + OTP
 * Run: npx tsx backend/scripts/seed-test-user.ts
 *
 * Creates:
 *   - User: test@gather.local  (displayName đã đặt → vào /home thẳng)
 *   - OTP:  123456  (purpose: login, hết hạn sau 24h)
 */

import mongoose from "mongoose";
import User from "../models/User.js";
import OtpCode from "../models/OtpCode.js";
import { createSession } from "../utils/tokenManager.js";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/gather-town";

const TEST_EMAIL = "test@gather.local";
const TEST_OTP = "123456";
const TEST_NAME = "Test User";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB:", MONGODB_URI);

  // ── 1. Upsert test user ────────────────────────────────────────
  let user = await User.findOne({ email: TEST_EMAIL });

  if (!user) {
    let username = "test_user";
    let suffix = 0;
    while (await User.findOne({ username })) {
      suffix++;
      username = `test_user${suffix}`;
    }
    user = new User({
      username,
      email: TEST_EMAIL,
      displayName: TEST_NAME,
    });
    await user.save();
    console.log("✅ Created user:", TEST_EMAIL);
  } else {
    // Ensure displayName is set so they go straight to /home
    if (!user.displayName) {
      user.displayName = TEST_NAME;
      await user.save();
    }
    console.log("ℹ️  User already exists:", TEST_EMAIL);
  }

  // ── 2. Invalidate old OTPs, create fresh one ───────────────────
  await OtpCode.updateMany(
    { email: TEST_EMAIL, purpose: "login", used: false },
    { $set: { used: true } },
  );

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  await OtpCode.create({
    email: TEST_EMAIL,
    code: TEST_OTP,
    purpose: "login",
    used: false,
    expiresAt,
  });
  console.log("✅ OTP created:", TEST_OTP, "(hết hạn sau 24h)");

  // ── 3. Also generate a ready-to-use token (optional shortcut) ──
  const { accessToken } = await createSession(
    user._id.toString(),
    "seed-script",
    "127.0.0.1",
    "seed-script",
  );

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 TEST USER READY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Email  :", TEST_EMAIL);
  console.log("  OTP    :", TEST_OTP);
  console.log("  Name   :", TEST_NAME);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📌 Cách dùng (Option A – qua UI):");
  console.log("  1. Vào http://localhost:5173/auth/email");
  console.log("  2. Nhập email:", TEST_EMAIL);
  console.log("  3. Nhập OTP:", TEST_OTP);
  console.log("  4. → Vào thẳng /home (đã có tên)");
  console.log("\n📌 Cách dùng (Option B – paste token vào browser console):");
  console.log(`  localStorage.setItem('token', '${accessToken}')`);
  console.log("  window.location.href = '/home'");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
