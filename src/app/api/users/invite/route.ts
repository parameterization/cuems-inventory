import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendInviteEmail } from '@/lib/email';
import * as bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, role, tempPassword } = await req.json();

    if (!email || !role || !tempPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!email.endsWith('@columbia.edu')) {
      return NextResponse.json({ error: 'Must be Columbia email' }, { status: 400 });
    }

    if (!['ADMIN', 'PROBIE', 'DRIVER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        isSupremeAdmin: false,
        needsPasswordChange: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isSupremeAdmin: true,
        createdAt: true,
      },
    });

    // Send invite email
    try {
      await sendInviteEmail(email, tempPassword, session.user.email);
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Continue even if email fails - admin can manually share credentials
    }

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
}

