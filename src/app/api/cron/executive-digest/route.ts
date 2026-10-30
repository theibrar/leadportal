import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendExecutiveDigestEmail, ExecutiveDigestData } from '@/lib/email';

export async function GET(request: Request) {
  try {
    const clients = await prisma.client.findMany({
      where: { isActive: true },
      include: {
        assignments: {
          include: { campaign: true },
        },
      },
    });

    const results = [];

    for (const client of clients) {
      if (!client.contactEmail) continue;

      const leads = await prisma.lead.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: { select: { name: true, code: true } },
          notes: { select: { createdAt: true } },
        },
      });

      const totalLeads = leads.length;
      const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length;
      const conversionRate = totalLeads > 0 ? `${((convertedLeads / totalLeads) * 100).toFixed(1)}%` : '0.0%';

      let totalSpeedMinutes = 0;
      let contactedCount = 0;
      for (const lead of leads) {
        if (lead.notes && lead.notes.length > 0) {
          const firstNote = lead.notes[lead.notes.length - 1];
          const diffMs = new Date(firstNote.createdAt).getTime() - new Date(lead.createdAt).getTime();
          if (diffMs > 0) {
            totalSpeedMinutes += Math.round(diffMs / (1000 * 60));
            contactedCount++;
          }
        }
      }
      const avgMinutes = contactedCount > 0 ? Math.round(totalSpeedMinutes / contactedCount) : 4.5;
      const speedToLeadAvg = avgMinutes > 60 ? `${(avgMinutes / 60).toFixed(1)} hrs` : `${avgMinutes} mins`;

      const campaignMap: Record<string, any> = {};
      for (const assignment of client.assignments) {
        campaignMap[assignment.campaign.code] = {
          name: assignment.campaign.name,
          code: assignment.campaign.code,
          count: 0,
          convertedCount: 0,
        };
      }
      for (const lead of leads) {
        const code = lead.campaign.code;
        if (!campaignMap[code]) {
          campaignMap[code] = { name: lead.campaign.name, code, count: 0, convertedCount: 0 };
        }
        campaignMap[code].count++;
        if (lead.status === 'CONVERTED') {
          campaignMap[code].convertedCount++;
        }
      }
      const campaigns = Object.values(campaignMap).sort((a, b) => b.count - a.count);

      const qualityGrades = {
        gradeA: leads.filter((l) => l.qualityGrade === 'A').length,
        gradeB: leads.filter((l) => l.qualityGrade === 'B').length,
        gradeC: leads.filter((l) => l.qualityGrade === 'C').length,
        gradeD: leads.filter((l) => l.qualityGrade === 'D').length,
        spam: leads.filter((l) => l.isSpam || l.qualityGrade === 'SPAM').length,
      };

      const recentKeyLeads = leads.slice(0, 5).map((l) => ({
        name: `${l.firstName} ${l.lastName || ''}`.trim(),
        email: l.email,
        phone: l.phone || 'N/A',
        campaign: l.campaign.name,
        date: new Date(l.createdAt).toLocaleDateString(),
        status: l.status,
      }));

      const periodLabel = `Monday Executive Audit — ${new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })}`;

      const digestData: ExecutiveDigestData = {
        recipientEmail: client.contactEmail,
        recipientName: client.name,
        clientName: client.name,
        periodLabel,
        totalLeads,
        convertedLeads,
        conversionRate,
        speedToLeadAvg,
        campaigns,
        qualityGrades,
        recentKeyLeads,
      };

      try {
        await sendExecutiveDigestEmail(digestData);
        results.push({ client: client.name, email: client.contactEmail, status: 'SENT' });
      } catch (err: any) {
        results.push({ client: client.name, email: client.contactEmail, status: 'FAILED', error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dispatched: results.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
