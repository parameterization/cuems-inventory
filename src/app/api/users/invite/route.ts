import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendInviteEmail } from '@/lib/email';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

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

    // Create user with random temporary password
    const tempPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: tempPasswordHash,
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

    // Generate password setup token
    const setupToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.passwordResetToken.create({
      data: {
        userId: newUser.id,
        token: setupToken,
        expiresAt,
      },
    });

    // Send invite email with setup link
    try {
      await sendInviteEmail(email, setupToken, session.user.email);
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({ 
      ...newUser, 
      setupToken // Return token so admin can manually share if email fails
    }, { status: 201 });
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
}

