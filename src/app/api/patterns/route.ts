import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patternKey = searchParams.get("pattern");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "15")));
    const search = (searchParams.get("search") ?? "").toLowerCase();

    const filePath = path.join(process.cwd(), "samundar-data", "leetcode-by-pattern.json");
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    if (patternKey) {
      const pattern = data.patterns[patternKey];
      if (!pattern) {
        return NextResponse.json({ error: "Pattern not found" }, { status: 404 });
      }

      const allProblems = [
        ...pattern.easy.map((p: { id: number; title: string; link: string }) => ({ ...p, difficulty: "EASY" })),
        ...pattern.medium.map((p: { id: number; title: string; link: string }) => ({ ...p, difficulty: "MEDIUM" })),
        ...pattern.hard.map((p: { id: number; title: string; link: string }) => ({ ...p, difficulty: "HARD" })),
      ];

      if (search) {
        allProblems.filter((p: { id: number; title: string; link: string; difficulty: string }) =>
          p.title.toLowerCase().includes(search)
        );
      }

      const total = allProblems.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const problems = allProblems.slice(start, start + pageSize);

      return NextResponse.json({
        key: patternKey,
        name: pattern.name,
        description: pattern.description ?? null,
        problems,
        total,
        page,
        pageSize,
        totalPages,
      });
    }

    let patternEntries = Object.entries(data.patterns as Record<string, { name: string; description?: string; easy: { id: number; title: string; link: string }[]; medium: { id: number; title: string; link: string }[]; hard: { id: number; title: string; link: string }[] }>).map(([key, p]) => ({
      key,
      name: p.name,
      description: p.description ?? null,
      easy: p.easy.length,
      medium: p.medium.length,
      hard: p.hard.length,
      total: p.easy.length + p.medium.length + p.hard.length,
    }));

    if (search) {
      patternEntries = patternEntries.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.key.replace(/-/g, " ").includes(search) ||
          (p.description ?? "").toLowerCase().includes(search)
      );
    }

    const total = patternEntries.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const patterns = patternEntries.slice(start, start + pageSize);

    return NextResponse.json({ patterns, total, page, pageSize, totalPages });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
