import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with industry campaign presets...');

  // Clean existing tables
  await prisma.activityLog.deleteMany();
  await prisma.webhookLog.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.clientCampaign.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();

  const hashedAdminPassword = await bcrypt.hash('Admin123!', 10);
  const hashedClientPassword = await bcrypt.hash('Client123!', 10);

  // 1. Create Admin User
  await prisma.user.create({
    data: {
      email: 'hussain@ibrasoft.com',
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
      isActive: true,
      profile: {
        create: {
          fullName: 'Sarah Jenkins',
          phone: '+1 (555) 019-2831',
          companyName: 'IbraSoft LeadPortal',
          timezone: 'America/New_York',
        },
      },
    },
  });

  // 2. Create Clients
  const clientApex = await prisma.client.create({
    data: {
      name: 'Apex Digital Solutions',
      companyCode: 'APEX',
      contactEmail: 'contact@apexdigital.com',
      contactPhone: '+1 (555) 234-5678',
      isActive: true,
    },
  });

  const clientNexus = await prisma.client.create({
    data: {
      name: 'Nexus Growth Marketing',
      companyCode: 'NEXUS',
      contactEmail: 'hello@nexusgrowth.io',
      contactPhone: '+1 (555) 876-5432',
      isActive: true,
    },
  });

  // 3. Create Client Users
  await prisma.user.create({
    data: {
      email: 'client@apexdigital.com',
      passwordHash: hashedClientPassword,
      role: 'CLIENT',
      clientId: clientApex.id,
      isActive: true,
      profile: {
        create: {
          fullName: 'Marcus Vance',
          phone: '+1 (555) 234-5678',
          companyName: 'Apex Digital Solutions',
          timezone: 'America/Los_Angeles',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'client@nexusgrowth.com',
      passwordHash: hashedClientPassword,
      role: 'CLIENT',
      clientId: clientNexus.id,
      isActive: true,
      profile: {
        create: {
          fullName: 'Elena Rostova',
          phone: '+1 (555) 876-5432',
          companyName: 'Nexus Growth Marketing',
          timezone: 'America/Chicago',
        },
      },
    },
  });

  // 4. Create Prescribed Campaigns
  const campaignPresets = [
    { name: 'Affordable Care Act', code: 'ACA', description: 'Health insurance open enrollment & ACA lead intake.' },
    { name: 'Auto Insurance', code: 'AUTO', description: 'Automobile insurance policy comparison leads.' },
    { name: 'Diabetes', code: 'DB', description: 'Specialized healthcare & diabetes management support leads.' },
    { name: 'Final Expense', code: 'FE', description: 'Senior life insurance & final expense planning leads.' },
    { name: 'Home Improvements', code: 'HOME', description: 'Residential roofing, solar, and remodeling leads.' },
    { name: 'MVA - Apply', code: 'APPLY', description: 'Motor Vehicle Accident application qualification leads.' },
    { name: 'MVA - Claimz', code: 'CLAIMZ', description: 'Motor Vehicle Accident legal claims intake.' },
    { name: 'MVA - First', code: 'FIRST', description: 'Motor Vehicle Accident first response leads.' },
    { name: 'MVA - Select', code: 'SELECT', description: 'Motor Vehicle Accident selected legal partner leads.' },
    { name: 'Medicare', code: 'MED', description: 'Medicare Advantage & Supplement insurance leads.' },
    { name: 'Motor Vehicle Accident', code: 'MVA', description: 'General Motor Vehicle Accident injury lead intake.' },
  ];

  const createdCampaigns: Record<string, any> = {};

  for (const preset of campaignPresets) {
    const c = await prisma.campaign.create({
      data: {
        name: preset.name,
        code: preset.code,
        description: preset.description,
        isActive: true,
      },
    });
    createdCampaigns[preset.code] = c;
  }

  // 5. Assign Campaigns to Clients & Generate Webhooks
  const assignApexACA = await prisma.clientCampaign.create({
    data: {
      clientId: clientApex.id,
      campaignId: createdCampaigns['ACA'].id,
      webhookToken: 'whk_apex_aca_9f8a2b3c',
      secretKey: 'sec_apex_aca_secret123',
      isActive: true,
    },
  });

  const assignApexAUTO = await prisma.clientCampaign.create({
    data: {
      clientId: clientApex.id,
      campaignId: createdCampaigns['AUTO'].id,
      webhookToken: 'whk_apex_auto_4b2c8d1e',
      secretKey: 'sec_apex_auto_secret456',
      isActive: true,
    },
  });

  const assignNexusMED = await prisma.clientCampaign.create({
    data: {
      clientId: clientNexus.id,
      campaignId: createdCampaigns['MED'].id,
      webhookToken: 'whk_nexus_med_7e1d3f9a',
      secretKey: 'sec_nexus_med_secret789',
      isActive: true,
    },
  });

  // 6. Seed Realistic Leads
  const apexLeadsData = [
    {
      firstName: 'David',
      lastName: 'Miller',
      email: 'david.m@techfront.io',
      phone: '+1 415-555-0143',
      source: 'Google Search Ads',
      status: 'QUALIFIED',
      customData: JSON.stringify({ utm_source: 'google', campaign_type: 'ACA', company: 'Techfront Inc', state: 'FL' }),
      clientCampaignId: assignApexACA.id,
      campaignId: createdCampaigns['ACA'].id,
    },
    {
      firstName: 'Samantha',
      lastName: 'Reed',
      email: 'samantha@reedsolutions.com',
      phone: '+1 212-555-0199',
      source: 'Google Search Ads',
      status: 'CONVERTED',
      customData: JSON.stringify({ utm_source: 'google', campaign_type: 'AUTO', vehicle: '2024 Tesla Model Y' }),
      clientCampaignId: assignApexAUTO.id,
      campaignId: createdCampaigns['AUTO'].id,
    },
    {
      firstName: 'Jessica',
      lastName: 'Alba',
      email: 'jessica@honestco.com',
      phone: '+1 310-555-0122',
      source: 'Facebook Ads',
      status: 'NEW',
      customData: JSON.stringify({ utm_source: 'facebook', campaign_type: 'ACA', coverage_needed: 'Family' }),
      clientCampaignId: assignApexACA.id,
      campaignId: createdCampaigns['ACA'].id,
    },
  ];

  for (const lead of apexLeadsData) {
    await prisma.lead.create({
      data: {
        clientId: clientApex.id,
        ...lead,
      },
    });
  }

  const nexusLeadsData = [
    {
      firstName: 'Alexander',
      lastName: 'Wright',
      email: 'awright@capitalventures.com',
      phone: '+1 212-555-0321',
      source: 'Medicare Direct',
      status: 'QUALIFIED',
      customData: JSON.stringify({ utm_source: 'medicare_portal', age: '67', plan_type: 'Medicare Advantage' }),
      clientCampaignId: assignNexusMED.id,
      campaignId: createdCampaigns['MED'].id,
    },
  ];

  for (const lead of nexusLeadsData) {
    await prisma.lead.create({
      data: {
        clientId: clientNexus.id,
        ...lead,
      },
    });
  }

  // 7. Seed Webhook Logs
  await prisma.webhookLog.createMany({
    data: [
      {
        clientId: clientApex.id,
        clientCampaignId: assignApexACA.id,
        status: 'SUCCESS',
        httpStatusCode: 201,
        payload: JSON.stringify({ firstName: 'David', lastName: 'Miller', email: 'david.m@techfront.io', source: 'ACA Form' }),
        executionTimeMs: 42,
        ipAddress: '64.233.160.1',
      },
      {
        clientId: clientNexus.id,
        clientCampaignId: assignNexusMED.id,
        status: 'SUCCESS',
        httpStatusCode: 201,
        payload: JSON.stringify({ firstName: 'Alexander', lastName: 'Wright', email: 'awright@capitalventures.com', source: 'Medicare Form' }),
        executionTimeMs: 38,
        ipAddress: '108.174.10.1',
      },
    ],
  });

  console.log('✅ Database successfully seeded with 11 industry campaign presets!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
