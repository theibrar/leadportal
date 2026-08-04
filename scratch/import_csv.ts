import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/db';

function parseCSVLine(line: string): string[] {
  const res: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (c === ',' && !inQ) {
      res.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  res.push(cur.trim());
  return res;
}

async function main() {
  const clientId = '1ed2a470-72b9-499a-bd93-524822602d05'; // Muhammad Hasnain / NEXAGEN
  const csvPath = path.join(process.cwd(), 'client_leads_export_1ed2a470-72b9-499a-bd93-524822602d05_1785837156319.csv');

  console.log('Reading CSV file from:', csvPath);
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
  const header = parseCSVLine(lines[0]);
  console.log('CSV Header:', header);

  // Fetch client assignments for mapping campaign name to ClientCampaign
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      assignments: {
        include: {
          campaign: true,
        },
      },
    },
  });

  if (!client) {
    console.error('Client not found!');
    return;
  }

  console.log('Client name:', client.name, 'Code:', client.companyCode);
  console.log(
    'Assigned campaigns:',
    client.assignments.map((a) => `${a.campaign.name} (Assignment ID: ${a.id}, Campaign ID: ${a.campaignId})`)
  );

  const campaignMap = new Map<string, { campaignId: string; clientCampaignId: string }>();
  for (const a of client.assignments) {
    campaignMap.set(a.campaign.name.toLowerCase().trim(), {
      campaignId: a.campaignId,
      clientCampaignId: a.id,
    });
  }

  // Fetch existing lead IDs and emails for this client to avoid duplicates
  const existingLeads = await prisma.lead.findMany({
    where: { clientId },
    select: { id: true, email: true, createdAt: true },
  });

  const existingIds = new Set(existingLeads.map((l) => l.id));
  const existingEmails = new Set(existingLeads.map((l) => l.email.toLowerCase()));

  console.log(`Existing DB leads for client: ${existingLeads.length}`);

  let insertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 10) continue;

    const [
      id,
      firstName,
      lastName,
      email,
      phone,
      source,
      status,
      campaignName,
      clientName,
      receivedDate,
      customDataRaw,
    ] = cols;

    // Remove formula injection defense leading single quote if present
    const cleanId = id.replace(/^'/, '');
    const cleanEmail = email.replace(/^'/, '');
    const cleanFirstName = firstName.replace(/^'/, '');
    const cleanLastName = lastName.replace(/^'/, '');
    const cleanPhone = phone.replace(/^'/, '');
    const cleanSource = source.replace(/^'/, '') || 'WEBHOOK_LANDING_PAGE';
    const cleanStatus = status.replace(/^'/, '') || 'NEW';
    const cleanCampaignName = campaignName.replace(/^'/, '');
    const cleanReceivedDate = receivedDate.replace(/^'/, '');
    const cleanCustomData = customDataRaw ? customDataRaw.replace(/^'/, '') : null;

    if (existingIds.has(cleanId)) {
      skippedCount++;
      continue;
    }

    const mapping = campaignMap.get(cleanCampaignName.toLowerCase().trim());
    if (!mapping) {
      console.warn(`Row ${i}: No matching campaign found for "${cleanCampaignName}"`);
      // Fallback to first assignment if exists
      const firstAssignment = client.assignments[0];
      if (!firstAssignment) {
        errorCount++;
        continue;
      }
    }

    const targetMapping = mapping || {
      campaignId: client.assignments[0].campaignId,
      clientCampaignId: client.assignments[0].id,
    };

    try {
      await prisma.lead.create({
        data: {
          id: cleanId,
          clientId: client.id,
          campaignId: targetMapping.campaignId,
          clientCampaignId: targetMapping.clientCampaignId,
          firstName: cleanFirstName || 'Anonymous',
          lastName: cleanLastName || '',
          email: cleanEmail || 'N/A',
          phone: cleanPhone || '',
          source: cleanSource,
          status: cleanStatus,
          customData: cleanCustomData,
          createdAt: cleanReceivedDate ? new Date(cleanReceivedDate) : new Date(),
        },
      });
      insertedCount++;
      existingIds.add(cleanId);
    } catch (err: any) {
      console.error(`Error inserting lead ${cleanId} (${cleanEmail}):`, err.message);
      errorCount++;
    }
  }

  console.log('\n--- Import Summary ---');
  console.log('Total CSV rows:', lines.length - 1);
  console.log('Successfully inserted:', insertedCount);
  console.log('Skipped (already in DB):', skippedCount);
  console.log('Errors:', errorCount);

  const finalCount = await prisma.lead.count({ where: { clientId } });
  console.log('New total DB leads for Muhammad Hasnain:', finalCount);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
