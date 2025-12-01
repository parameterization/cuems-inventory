import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await req.json();

    if (!data.name || !data.cabinet || !data.shelf || !data.unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const initialQuantity = data.quantity || 0;

    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        cabinet: data.cabinet,
        shelf: data.shelf,
        unit: data.unit,
        quantity: initialQuantity,
        minimalBalance: data.minimalBalance || 1,
        itemNumber: data.itemNumber || null,
        vendor: data.vendor || null,
        notes: data.notes || null,
      },
    });

    // Log item creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        itemId: item.id,
        itemName: item.name,
        action: 'CREATED',
        before: 0,
        after: initialQuantity,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}


