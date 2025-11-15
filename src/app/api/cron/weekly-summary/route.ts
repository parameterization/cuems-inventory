import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
    });

    if (admins.length === 0) {
      return NextResponse.json({ message: 'No admins found' });
    }

    // Get low stock items
    const allItems = await prisma.inventoryItem.findMany({
      orderBy: { cabinet: 'asc' },
    });

    const lowStockItems = allItems.filter(item => Number(item.quantity) < Number(item.minimalBalance));
    const outOfStockItems = allItems.filter(item => Number(item.quantity) === 0);

    // Get activity from past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyActivity = await prisma.auditLog.findMany({
      where: {
        timestamp: { gte: oneWeekAgo },
      },
      include: {
        user: { select: { email: true } },
        item: { select: { name: true } },
      },
    });

    const takeCount = weeklyActivity.filter(log => log.action === 'TAKE').length;
    const returnCount = weeklyActivity.filter(log => log.action === 'RETURN').length;
    const inventoryCheckCount = new Set(
      weeklyActivity.filter(log => log.action === 'SET' && log.batchId).map(log => log.batchId)
    ).size;

    // Build email HTML
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: #003C71; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">CUEMS Inventory Weekly Summary</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Week of ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="padding: 30px; background: #f5f5f5;">
          <!-- Activity Summary -->
          <div style="background: white; padding: 20px; margin-bottom: 20px; border-left: 4px solid #003C71;">
            <h2 style="color: #003C71; margin-top: 0;">📊 Weekly Activity</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Items Taken:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${takeCount}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Items Returned:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${returnCount}</td>
              </tr>
              <tr>
                <td style="padding: 10px;"><strong>Inventory Checks:</strong></td>
                <td style="padding: 10px; text-align: right;">${inventoryCheckCount}</td>
              </tr>
            </table>
          </div>

          ${outOfStockItems.length > 0 ? `
          <!-- Out of Stock -->
          <div style="background: #fee; padding: 20px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h2 style="color: #dc2626; margin-top: 0;">🚨 OUT OF STOCK (${outOfStockItems.length})</h2>
            <ul style="margin: 0; padding-left: 20px;">
              ${outOfStockItems.map(item => `
                <li style="margin: 8px 0;">
                  <strong>${item.name}</strong> - ${item.cabinet} Cabinet, Shelf ${item.shelf}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          ${lowStockItems.length > 0 ? `
          <!-- Low Stock -->
          <div style="background: #fef3c7; padding: 20px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h2 style="color: #f59e0b; margin-top: 0;">⚠️ LOW STOCK (${lowStockItems.length})</h2>
            <ul style="margin: 0; padding-left: 20px;">
              ${lowStockItems.map(item => `
                <li style="margin: 8px 0;">
                  <strong>${item.name}</strong> - Current: ${item.quantity}, Min: ${item.minimalBalance}
                  <br><span style="color: #666; font-size: 14px;">${item.cabinet} Cabinet, Shelf ${item.shelf}</span>
                </li>
              `).join('')}
            </ul>
          </div>
          ` : `
          <div style="background: #d1fae5; padding: 20px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h2 style="color: #10b981; margin-top: 0;">✅ All Stock Levels Good</h2>
            <p style="margin: 0;">No items are below their minimal balance threshold.</p>
          </div>
          `}

          <!-- Summary Stats -->
          <div style="background: white; padding: 20px; border-left: 4px solid #003C71;">
            <h2 style="color: #003C71; margin-top: 0;">📦 Inventory Overview</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Total Items:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${allItems.length}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Low Stock:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: #f59e0b; font-weight: bold;">${lowStockItems.length}</td>
              </tr>
              <tr>
                <td style="padding: 10px;"><strong>Out of Stock:</strong></td>
                <td style="padding: 10px; text-align: right; color: #dc2626; font-weight: bold;">${outOfStockItems.length}</td>
              </tr>
            </table>
          </div>
        </div>

        <div style="background: #003C71; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">
            View full details at <a href="https://cuemsinventory.com" style="color: #9BDDFF;">cuemsinventory.com</a>
          </p>
        </div>
      </div>
    `;

    // Send email to all admins
    if (resend) {
      await resend.emails.send({
        from: 'CUEMS Inventory <noreply@cuemsinventory.com>',
        to: admins.map(admin => admin.email),
        subject: `CUEMS Inventory Weekly Summary - ${outOfStockItems.length} Out of Stock, ${lowStockItems.length} Low`,
        html: emailHtml,
      });
    }

    return NextResponse.json({
      success: true,
      sent_to: admins.length,
      low_stock: lowStockItems.length,
      out_of_stock: outOfStockItems.length,
      weekly_takes: takeCount,
      weekly_returns: returnCount,
      inventory_checks: inventoryCheckCount,
    });
  } catch (error) {
    console.error('Error sending weekly summary:', error);
    return NextResponse.json({ error: 'Failed to send summary' }, { status: 500 });
  }
}

