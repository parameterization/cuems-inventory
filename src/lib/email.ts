import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendInviteEmail(
  email: string,
  setupToken: string,
  invitedBy: string
) {
  const setupUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${setupToken}`;

  if (!resend) {
    console.warn('Resend not configured - email not sent');
    return;
  }

  try {
    await resend.emails.send({
      from: 'CUEMS Inventory <noreply@cuemsinventory.com>',
      to: email,
      subject: 'Welcome to CUEMS Inventory - Set Your Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #003C71;">Welcome to CUEMS Inventory</h1>
          <p>You've been invited to CUEMS Inventory by <strong>${invitedBy}</strong>.</p>
          
          <p>Click the button below to set your password and activate your account:</p>
          
          <a href="${setupUrl}" 
             style="display: inline-block; background: #003C71; color: white; padding: 14px 28px; text-decoration: none; margin: 20px 0; font-weight: bold; font-size: 16px;">
            Set Your Password
          </a>
          
          <p style="color: #666; font-size: 14px;">
            Your email: <strong>${email}</strong><br>
            This link expires in 7 days.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Or copy this link: ${setupUrl}
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an internal CUEMS tool. If you received this email in error, please ignore it.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending invite email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

  if (!resend) {
    console.warn('Resend not configured - email not sent');
    return;
  }

  try {
    await resend.emails.send({
      from: 'CUEMS Inventory <noreply@cuemsinventory.com>',
      to: email,
      subject: 'Reset Your CUEMS Inventory Password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #003C71;">Reset Your Password</h1>
          <p>You requested to reset your password for CUEMS Inventory.</p>
          
          <a href="${resetUrl}" 
             style="display: inline-block; background: #003C71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Reset Password
          </a>
          
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Or copy this link: ${resetUrl}
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

