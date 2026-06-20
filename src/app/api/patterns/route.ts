import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patternKey = searchParams.get("pattern");

    const filePath = path.join(process.cwd(), "samundar-data", "leetcode-by-pattern.json");
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    if (patternKey) {
      const pattern = data.patterns[patternKey];
      if (!pattern) {
        return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
      }
      return NextResponse.json({ key: patternKey, ...pattern });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
