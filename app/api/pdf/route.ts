import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'Summer202026.pdf');
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Summer202026.pdf"',
      },
    });
  } catch (error) {
    return new NextResponse('PDF not found', { status: 404 });
  }
}
