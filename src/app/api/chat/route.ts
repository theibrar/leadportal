import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/getSession';

const DEEPSEEK_API_KEY = 'sk-581973971bf24e7f8205638697a8167e';
const DEEPSEEK_MODEL = 'deepseek-v4-flash';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

// Build context data based on user role
async function getSystemContext(role: string, clientId?: string): Promise<string> {
  let context = '';

  if (role === 'ADMIN') {
    // Admin gets full system data
    const [clients, campaigns, leads, webhookLogs] = await Promise.all([
      prisma.client.findMany({
        include: {
          assignments: { include: { campaign: true } },
          _count: { select: { leads: true, webhookLogs: true } },
        },
      }),
      prisma.campaign.findMany({
        include: { _count: { select: { leads: true } } },
      }),
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          client: { select: { name: true, companyCode: true } },
          campaign: { select: { name: true, code: true } },
        },
      }),
      prisma.webhookLog.findMany({
        orderBy: { receivedAt: 'desc' },
        take: 50,
        include: {
          client: { select: { name: true } },
        },
      }),
    ]);

    context += `## SYSTEM OVERVIEW\n`;
    context += `Total Clients: ${clients.length}\n`;
    context += `Total Campaigns: ${campaigns.length}\n`;
    context += `Total Leads (showing latest 200): ${leads.length}\n\n`;

    context += `## CLIENTS\n`;
    clients.forEach((c) => {
      context += `- ${c.name} (Code: ${c.companyCode}, Email: ${c.contactEmail}, Phone: ${c.contactPhone || 'N/A'}, Active: ${c.isActive}, Leads: ${c._count.leads}, Webhooks: ${c._count.webhookLogs}, IP Whitelist: ${c.allowedIps || 'Any'})\n`;
      c.assignments.forEach((a: any) => {
        context += `  ↳ Campaign: ${a.campaign.name} (Active: ${a.isActive})\n`;
      });
    });

    context += `\n## CAMPAIGNS\n`;
    campaigns.forEach((c) => {
      context += `- ${c.name} (Code: ${c.code}, Active: ${c.isActive}, Leads: ${c._count.leads})\n`;
    });

    context += `\n## RECENT LEADS (Latest 200)\n`;
    leads.forEach((l) => {
      context += `- ${l.firstName} ${l.lastName || ''} | Email: ${l.email} | Phone: ${l.phone || 'N/A'} | Client: ${l.client?.name} | Campaign: ${l.campaign?.name} | Status: ${l.status} | Source: ${l.source} | Date: ${l.createdAt.toISOString()}\n`;
    });

    context += `\n## RECENT WEBHOOK LOGS (Latest 50)\n`;
    webhookLogs.forEach((w) => {
      context += `- Client: ${w.client?.name} | Status: ${w.status} | HTTP: ${w.httpStatusCode} | Time: ${w.executionTimeMs}ms | IP: ${w.ipAddress} | Date: ${w.receivedAt.toISOString()}${w.errorMessage ? ` | Error: ${w.errorMessage}` : ''}\n`;
    });

  } else if (clientId) {
    // Client gets only their own data
    const [client, leads, campaigns] = await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        include: {
          assignments: { include: { campaign: true } },
          _count: { select: { leads: true } },
        },
      }),
      prisma.lead.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          campaign: { select: { name: true, code: true } },
        },
      }),
      prisma.clientCampaign.findMany({
        where: { clientId },
        include: { campaign: true },
      }),
    ]);

    if (client) {
      context += `## YOUR ACCOUNT\n`;
      context += `Company: ${client.name} (Code: ${client.companyCode})\n`;
      context += `Contact: ${client.contactEmail} | ${client.contactPhone || 'N/A'}\n`;
      context += `Total Leads: ${client._count.leads}\n\n`;

      context += `## YOUR CAMPAIGNS\n`;
      campaigns.forEach((a) => {
        context += `- ${a.campaign.name} (Code: ${a.campaign.code}, Active: ${a.isActive})\n`;
      });

      context += `\n## YOUR LEADS (Latest 200)\n`;
      leads.forEach((l) => {
        context += `- ${l.firstName} ${l.lastName || ''} | Email: ${l.email} | Phone: ${l.phone || 'N/A'} | Campaign: ${l.campaign?.name} | Status: ${l.status} | Source: ${l.source} | Date: ${l.createdAt.toISOString()}\n`;
      });
    }
  }

  return context;
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { messages } = await request.json();
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
  }

  // Build system context from database
  const dataContext = await getSystemContext(session.role, session.clientId || undefined);

  const systemPrompt = `You are the IbraSoft AI Assistant — an expert, professional support agent for the LeadPortal platform by IbraSoft.

User Info:
- Role: ${session.role}
- ${session.role === 'ADMIN' ? 'Full platform admin access' : `Client: ${session.companyName || 'Client Tenant'}`}

CRITICAL RESPONSE RULES:
1. BE EXTREMELY CONCISE, DIRECT, AND TO THE POINT.
2. KEEP ANSWERS SHORT, EXPLICIT, AND PROFESSIONAL.
3. FOR GREETINGS / HELLO / HI / HEY: Reply in EXACTLY ONE SHORT SENTENCE (e.g. "Hello! How can I assist you with your leads or portal data today?"). DO NOT print system data, snapshots, or lists when greeted!
4. FOR SPECIFIC QUESTIONS: Give the exact answer directly in 1-3 short bullet points. No lengthy introductory paragraphs or fluff.
5. ONLY PROVIDE A FULL SNAPSHOT OR AUDIT IF THE USER EXPLICITLY ASKS (e.g., "Give me a full overview", "Show system audit", "Summarize all data").
6. Always format numbers, emails, and names clearly using markdown bolding.
7. Only answer based on the real system data provided below. If data isn't present, state it briefly.

LIVE SYSTEM DATA CONTEXT:
${dataContext}`;

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10), // Keep last 10 messages for context window
        ],
        thinking: { type: 'enabled' },
        reasoning_effort: 'max',
        max_tokens: 1024,
        temperature: 0.3,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to AI service.' },
      { status: 500 }
    );
  }
}
