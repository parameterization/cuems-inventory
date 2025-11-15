import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { role } = await req.json();

    if (!role || !['ADMIN', 'PROBIE', 'DRIVER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (targetUser?.isSupremeAdmin) {
      return NextResponse.json(
        { error: 'Cannot change supreme admin role' },
        { status: 403 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role: role },
      select: {
        id: true,
        email: true,
        role: true,
        isSupremeAdmin: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}


