/**
 * Usage:
 *   node scripts/seed-user.mjs <username> <password>
 *
 * Example:
 *   node scripts/seed-user.mjs admin secret1234
 */

import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error("Usage: node scripts/seed-user.mjs <username> <password>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const client = new MongoClient(process.env.DATABASE_URL);

try {
  await client.connect();
  const db = client.db();
  const users = db.collection("users");

  const existing = await users.findOne({ username: username.toLowerCase() });
  if (existing) {
    console.error(`User "${username}" already exists.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const now = new Date();

  const result = await users.insertOne({
    username: username.toLowerCase().trim(),
    password: hash,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`✓ User "${username}" created with id: ${result.insertedId}`);
} finally {
  await client.close();
}
