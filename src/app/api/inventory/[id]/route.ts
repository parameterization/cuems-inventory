import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get item details before deletion for audit log
    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Log deletion before deleting the item
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        itemId: null, // Will be null since item is being deleted
        itemName: item.name,
        action: 'DELETED',
        before: item.quantity,
        after: 0,
      },
    });

    await prisma.inventoryItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}

