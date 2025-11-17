import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE cabinet
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if cabinet is default
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: params.id },
    });

    if (cabinet?.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default cabinets' }, { status: 403 });
    }

    // Check if cabinet has items
    const itemCount = await prisma.inventoryItem.count({
      where: { cabinet: cabinet?.name },
    });

    if (itemCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete cabinet with ${itemCount} items. Move items first.` 
      }, { status: 400 });
    }

    await prisma.cabinet.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cabinet:', error);
    return NextResponse.json({ error: 'Failed to delete cabinet' }, { status: 500 });
  }
}

