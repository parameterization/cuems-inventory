import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newQuantity = Number(item.quantity) + 1;
      
      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          itemId: itemId,
          action: 'RETURN',
          before: item.quantity,
          after: newQuantity,
        },
      });

      return updatedItem;
    });

    // Broadcast real-time update
    if (process.env.PUSHER_APP_ID) {
      await pusherServer.trigger('inventory', 'item-updated', result);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error returning item:', error);
    return NextResponse.json({ error: 'Failed to return item' }, { status: 500 });
  }
}


