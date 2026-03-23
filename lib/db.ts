import mongoose from "mongoose";

const DATABASE_URL = process.env.DATABASE_URL!;

if (!DATABASE_URL) {
  throw new Error("Please define the DATABASE_URL environment variable in .env.local");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = mongoose.connect(DATABASE_URL);
}

export async function connectDB() {
  return cached;
}
