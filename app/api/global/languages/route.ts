import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "config", "locale.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const languages = JSON.parse(fileContent);

    return NextResponse.json(languages);
  } catch (error) {
    console.error("Error reading locale.json:", error);
    return NextResponse.json({ message: "Failed to load languages." }, { status: 500 });
  }
}
