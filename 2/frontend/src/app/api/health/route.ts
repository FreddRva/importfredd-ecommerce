import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Intentar conectar con el backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return NextResponse.json({ status: 'healthy', backend: 'available' });
    } else {
      return NextResponse.json({ status: 'unhealthy', backend: 'unavailable' }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({ status: 'unhealthy', backend: 'unavailable' }, { status: 503 });
  }
} 