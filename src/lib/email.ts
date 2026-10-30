import nodemailer from 'nodemailer';

// SMTP Configuration using provided IbraSoft Web Hosting Server
const SMTP_HOST = process.env.SMTP_HOST || 'premium257.web-hosting.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'leadsportal@ibrasoft.com';
const SMTP_PASS = process.env.SMTP_PASS || '@leadsportal12345';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'leadsportal@ibrasoft.com';

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
});

export interface ExecutiveDigestData {
  recipientEmail: string;
  recipientName?: string;
  clientName: string;
  periodLabel: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: string;
  speedToLeadAvg: string;
  campaigns: Array<{ name: string; code: string; count: number; convertedCount?: number }>;
  qualityGrades: {
    gradeA: number;
    gradeB: number;
    gradeC: number;
    gradeD: number;
    spam: number;
  };
  recentKeyLeads: Array<{
    name: string;
    email: string;
    phone: string;
    campaign: string;
    date: string;
    status: string;
  }>;
}

export async function sendExecutiveDigestEmail(data: ExecutiveDigestData) {
  const {
    recipientEmail,
    recipientName = 'Executive Team',
    clientName,
    periodLabel,
    totalLeads,
    convertedLeads,
    conversionRate,
    speedToLeadAvg,
    campaigns,
    qualityGrades,
    recentKeyLeads,
  } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Monday Lead Performance Digest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 36px 32px; color: #ffffff; text-align: left; }
    .badge { display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 12px; rounded: 9999px; border-radius: 50px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1; }
    .body-content { padding: 32px; }
    .kpi-grid { display: table; width: 100%; table-layout: fixed; margin-bottom: 28px; border-collapse: separate; border-spacing: 12px 0; }
    .kpi-card { display: table-cell; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; text-align: center; }
    .kpi-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .kpi-value { font-size: 26px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.1; }
    .kpi-sub { font-size: 10px; font-weight: 600; color: #10b981; margin-top: 4px; }
    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #334155; margin: 28px 0 12px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-bottom: 24px; }
    .data-table th { background: #f1f5f9; color: #475569; font-weight: 700; padding: 10px 12px; border-radius: 6px; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; font-family: monospace; }
    .pill-green { background: #ecfdf5; color: #047857; }
    .pill-blue { background: #eff6ff; color: #1d4ed8; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 13px; text-align: center; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3); }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; font-size: 11px; color: #94a3b8; }
    .footer a { color: #2563eb; text-decoration: none; font-weight: 700; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header Banner -->
    <div class="header">
      <span class="badge">Weekly Executive Digest</span>
      <h1>${clientName} • Performance Report</h1>
      <p>Period: ${periodLabel} • Automated Audit Summary</p>
    </div>

    <!-- Body Content -->
    <div class="body-content">
      <p style="font-size:13px; color:#475569; margin-top:0;">
        Hello <strong>${recipientName}</strong>,<br>
        Here is your official executive summary detailing marketing campaign acquisition, conversion rates, and sales follow-up velocity across your designated pipelines.
      </p>

      <!-- Key Metrics Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">Total Ingested</div>
          <div class="kpi-value">${totalLeads}</div>
          <div class="kpi-sub">Verified Prospects</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Won / Converted</div>
          <div class="kpi-value" style="color:#059669;">${convertedLeads}</div>
          <div class="kpi-sub">${conversionRate} Win Rate</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-title">Speed to Lead</div>
          <div class="kpi-value" style="color:#2563eb;">${speedToLeadAvg}</div>
          <div class="kpi-sub">Average Contact Velocity</div>
        </div>
      </div>

      <!-- Campaign Breakdown -->
      <div class="section-title">Campaign Ingestion & Conversion Breakdown</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Campaign Name</th>
            <th>Code</th>
            <th style="text-align:right;">Total Volume</th>
            <th style="text-align:right;">Converted</th>
          </tr>
        </thead>
        <tbody>
          ${campaigns
            .map(
              (c) => `
            <tr>
              <td><strong>${c.name}</strong></td>
              <td><span class="pill pill-blue">${c.code}</span></td>
              <td style="text-align:right; font-weight:700;">${c.count} leads</td>
              <td style="text-align:right;"><span class="pill pill-green">${c.convertedCount || 0} won</span></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- Quality & Bot Shield Summary -->
      <div class="section-title">Lead Quality & Fraud Shield Analysis</div>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; font-size:12px; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <span>Grade A (High Intent): <strong>${qualityGrades.gradeA}</strong></span>
          <span>Grade B (Qualified): <strong>${qualityGrades.gradeB}</strong></span>
          <span>Grade C/D: <strong>${qualityGrades.gradeC + qualityGrades.gradeD}</strong></span>
          <span style="color:#e11d48;">Blocked Spam / Bots: <strong>${qualityGrades.spam}</strong></span>
        </div>
      </div>

      <!-- Recent High-Value Submissions -->
      <div class="section-title">Latest Customer Inquiries</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Prospect</th>
            <th>Contact</th>
            <th>Campaign</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${recentKeyLeads
            .slice(0, 5)
            .map(
              (l) => `
            <tr>
              <td><strong>${l.name}</strong></td>
              <td>${l.email}<br><span style="color:#64748b; font-size:10px;">${l.phone}</span></td>
              <td><span class="pill pill-blue">${l.campaign}</span></td>
              <td><span class="pill pill-green">${l.status}</span></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- Call to Action -->
      <div style="text-align:center; margin-top:32px; margin-bottom:12px;">
        <a href="http://ibrasoft.com" target="_blank" class="btn">
          Access Live Master Portal & CRM →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin:0 0 6px 0;">
        Powered by <strong>IbraSoft LeadFlow Portal v1.0.2</strong> • Enterprise Multi-Tenant Acquisition System
      </p>
      <p style="margin:0;">
        Designed and developed by <a href="http://ibrasoft.com/" target="_blank">IbraSoft</a>. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return await transporter.sendMail({
    from: `"IbraSoft LeadPortal" <${SENDER_EMAIL}>`,
    to: recipientEmail,
    subject: `Weekly Executive Digest: ${clientName} Lead Performance & Conversion Audit`,
    text: `Executive Digest for ${clientName}. Total Leads: ${totalLeads}, Won: ${convertedLeads}, Win Rate: ${conversionRate}, Speed to Lead: ${speedToLeadAvg}. Log in to view full dashboard.`,
    html,
  });
}
