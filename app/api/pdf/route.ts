import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export const runtime = 'nodejs';

type PdfCache = {
  raw: Buffer;
  gzip: Buffer;
  brotli: Buffer;
  lastModified: string;
  etag: string;
} | null;

let cachedPdf: PdfCache = null;

function resolvePdfPath(): string {
  const publicDir = path.join(process.cwd(), 'public');
  const candidates = ['menu.pdf', 'Summer202026.pdf'];

  for (const fileName of candidates) {
    const candidatePath = path.join(publicDir, fileName);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return path.join(publicDir, 'Summer202026.pdf');
}

function loadPdfCache(filePath: string): NonNullable<PdfCache> {
  const stats = fs.statSync(filePath);
  const lastModified = stats.mtime.toUTCString();
  const cacheKey = `${stats.size}-${stats.mtimeMs}`;

  if (cachedPdf && cachedPdf.etag === cacheKey) {
    return cachedPdf;
  }

  const raw = fs.readFileSync(filePath);
  const gzip = zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_COMPRESSION });
  const brotli = zlib.brotliCompressSync(raw, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
    },
  });

  cachedPdf = {
    raw,
    gzip,
    brotli,
    lastModified,
    etag: cacheKey,
  };

  return cachedPdf;
}

function getBaseHeaders(cache: NonNullable<PdfCache>): Record<string, string> {
  const filePath = resolvePdfPath();
  const fileName = path.basename(filePath);

  return {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${fileName}"`,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Last-Modified': cache.lastModified,
    ETag: cache.etag,
    Vary: 'Accept-Encoding',
  };
}

function toBody(buffer: Buffer): ArrayBuffer {
  const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return Uint8Array.from(bytes).buffer;
}

export async function GET(request: Request) {
  const filePath = resolvePdfPath();
  
  try {
    const cache = loadPdfCache(filePath);
    const baseHeaders = getBaseHeaders(cache);
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch === cache.etag) {
      return new NextResponse(null, {
        status: 304,
        headers: baseHeaders,
      });
    }

    const acceptEncoding = request.headers.get('accept-encoding') || '';

    if (acceptEncoding.includes('br') && cache.brotli.length < cache.raw.length) {
      return new NextResponse(toBody(cache.brotli), {
        headers: {
          ...baseHeaders,
          'Content-Encoding': 'br',
        },
      });
    }

    if (acceptEncoding.includes('gzip') && cache.gzip.length < cache.raw.length) {
      return new NextResponse(toBody(cache.gzip), {
        headers: {
          ...baseHeaders,
          'Content-Encoding': 'gzip',
        },
      });
    }

    return new NextResponse(toBody(cache.raw), { headers: baseHeaders });
  } catch (error) {
    return new NextResponse('PDF not found', { status: 404 });
  }
}

export async function HEAD() {
  const filePath = resolvePdfPath();

  try {
    const cache = loadPdfCache(filePath);
    
    return new NextResponse(null, {
      headers: getBaseHeaders(cache),
    });
  } catch (error) {
    return new NextResponse('PDF not found', { status: 404 });
  }
}
