import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE cabinet
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

    const cabinet = await prisma.cabinet.findUnique({
      where: { id: params.id },
    });

    // Check if cabinet has items
    const itemCount = await prisma.inventoryItem.count({
      where: { cabinet: cabinet?.name },
    });

    if (itemCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete - ${itemCount} items in this cabinet. Move items first.` 
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

// PATCH - Rename cabinet
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { newName } = await req.json();

    if (!newName || !newName.trim()) {
      return NextResponse.json({ error: 'New name required' }, { status: 400 });
    }

    const cabinet = await prisma.cabinet.findUnique({
      where: { id: params.id },
    });

    if (!cabinet) {
      return NextResponse.json({ error: 'Cabinet not found' }, { status: 404 });
    }

    // Update cabinet name in Cabinet table
    const updatedCabinet = await prisma.cabinet.update({
      where: { id: params.id },
      data: { name: newName.trim() },
    });

    // Update all items that reference this cabinet
    await prisma.inventoryItem.updateMany({
      where: { cabinet: cabinet.name },
      data: { cabinet: newName.trim() },
    });

    return NextResponse.json(updatedCabinet);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Cabinet name already exists' }, { status: 400 });
    }
    console.error('Error renaming cabinet:', error);
    return NextResponse.json({ error: 'Failed to rename cabinet' }, { status: 500 });
  }
}

