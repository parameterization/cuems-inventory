import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canDoInventoryCheck } from '@/lib/permissions';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !canDoInventoryCheck(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { updates } = await req.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const isAdmin = session.user.role === 'ADMIN';

    // Get current state before updating
    const currentItems = await prisma.inventoryItem.findMany({
      where: {
        id: { in: updates.map((u: any) => u.id) },
      },
    });

    // Generate a unique batch ID for this inventory check session
    const batchId = `batch_${Date.now()}_${session.user.id}`;

    // Perform bulk update in transaction
    const results = await prisma.$transaction(
      updates.map((update: any) => {
        const updateData: any = {
          quantity: update.quantity,
        };

        // Only admins can update other fields
        if (isAdmin) {
          if (update.minimalBalance !== undefined) updateData.minimalBalance = update.minimalBalance;
          if (update.unit !== undefined) updateData.unit = update.unit;
          if (update.itemNumber !== undefined) updateData.itemNumber = update.itemNumber;
          if (update.vendor !== undefined) updateData.vendor = update.vendor;
          if (update.notes !== undefined) updateData.notes = update.notes;
          if (update.cabinet !== undefined) updateData.cabinet = update.cabinet;
          if (update.shelf !== undefined) updateData.shelf = update.shelf;
        }

        return prisma.inventoryItem.update({
          where: { id: update.id },
          data: updateData,
        });
      })
    );

    // Create audit logs with batch ID
    await prisma.$transaction(
      updates.map((update: any) => {
        const oldItem = currentItems.find((item) => item.id === update.id);
        return prisma.auditLog.create({
          data: {
            userId: session.user.id,
            itemId: update.id,
            action: 'SET',
            before: oldItem?.quantity || 0,
            after: update.quantity,
            batchId: batchId,
          },
        });
      })
    );

    // Broadcast all updated items via Pusher for real-time updates
    if (process.env.PUSHER_APP_ID) {
      for (const updatedItem of results) {
        await pusherServer.trigger('inventory', 'item-updated', updatedItem);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error bulk updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update inventory' },
      { status: 500 }
    );
  }
}


