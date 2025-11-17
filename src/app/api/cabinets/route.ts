import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all cabinets
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cabinets = await prisma.cabinet.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(cabinets);
  } catch (error) {
    console.error('Error fetching cabinets:', error);
    return NextResponse.json({ error: 'Failed to fetch cabinets' }, { status: 500 });
  }
}

// POST - Create new cabinet
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Cabinet name required' }, { status: 400 });
    }

    const cabinet = await prisma.cabinet.create({
      data: {
        name: name.trim(),
        isDefault: false,
      },
    });

    return NextResponse.json(cabinet, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Cabinet already exists' }, { status: 400 });
    }
    console.error('Error creating cabinet:', error);
    return NextResponse.json({ error: 'Failed to create cabinet' }, { status: 500 });
  }
}

