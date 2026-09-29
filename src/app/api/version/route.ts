import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

let cachedBuildId: string | null = null;

function getBuildId(): string {
  if (cachedBuildId) return cachedBuildId;
  try {
    const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
    if (fs.existsSync(buildIdPath)) {
      cachedBuildId = fs.readFileSync(buildIdPath, 'utf8').trim();
      return cachedBuildId;
    }
  } catch {}
  cachedBuildId = process.env.RENDER_GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || 'dev_build';
  return cachedBuildId;
}

export async function GET(req: Request) {
  const buildId = getBuildId();
  const ifNoneMatch = req.headers.get('if-none-match');

  // Agar brauzerda shu versiya bo'lsa, 304 Not Modified qaytariladi (0 bayt ortiqcha trafik)
  if (ifNoneMatch && (ifNoneMatch === `"${buildId}"` || ifNoneMatch === buildId)) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'ETag': `"${buildId}"`,
        'Cache-Control': 'public, max-age=180, stale-while-revalidate=300',
      },
    });
  }

  return NextResponse.json(
    {
      buildId,
      timestamp: Date.now(),
    },
    {
      headers: {
        'ETag': `"${buildId}"`,
        'Cache-Control': 'public, max-age=180, stale-while-revalidate=300',
      },
    }
  );
}

