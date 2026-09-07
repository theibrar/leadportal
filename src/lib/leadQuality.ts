import { PrismaClient } from '@prisma/client';

// Common disposable email domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'yopmail.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'temp-mail.org',
  'emailondeck.com',
  'burnermail.io',
  'inboxkitten.com',
  'tempail.com',
  'dropmail.me',
  'mohmal.com',
  'crazymailing.com',
  'mytemp.email',
  'generator.email',
]);

// Repetitive or invalid phone patterns
const INVALID_PHONE_PATTERNS = [
  /^0+$/,
  /^1+$/,
  /^2+$/,
  /^3+$/,
  /^4+$/,
  /^5+$/,
  /^6+$/,
  /^7+$/,
  /^8+$/,
  /^9+$/,
  /^1234567890$/,
  /^0123456789$/,
  /^9876543210$/,
  /^0000000000$/,
  /^1111111111$/,
  /^5555555555$/,
  /^9999999999$/,
];

export interface LeadQualityAnalysis {
  score: number;
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'SPAM';
  isDuplicate: boolean;
  duplicateCount: number;
  isSpam: boolean;
  spamReason: string | null;
  detectedTimezone: string;
}

interface AnalyzeLeadParams {
  prisma: PrismaClient;
  clientId: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName?: string | null;
  rawPayload: Record<string, any>;
  clientTimezone?: string | null;
}

/**
 * Normalizes phone numbers to digits only
 */
export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Evaluates spam flags, bot indicators, and honeypot traps
 */
export function detectSpam(
  email: string,
  phone: string,
  firstName: string,
  lastName: string,
  rawPayload: Record<string, any>
): { isSpam: boolean; reason: string | null } {
  // 1. Honeypot check
  const honeypotKeys = ['honeypot', 'hp_field', 'website_hp', 'bot_trap', 'website_url_hp'];
  for (const key of honeypotKeys) {
    if (rawPayload[key] && String(rawPayload[key]).trim() !== '') {
      return { isSpam: true, reason: 'Honeypot trap triggered' };
    }
  }

  // 2. Disposable Email check
  const emailDomain = email.includes('@') ? email.split('@')[1]?.toLowerCase().trim() : '';
  if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
    return { isSpam: true, reason: 'Disposable temporary email domain (@' + emailDomain + ')' };
  }

  // 3. Invalid / Bot email patterns
  if (email.toLowerCase().includes('test@test') || email.toLowerCase().includes('example@example')) {
    return { isSpam: true, reason: 'Mock/Test email address detected' };
  }

  // 4. URL/HTML injection in name fields
  const combinedName = (firstName + ' ' + (lastName || '')).toLowerCase();
  if (
    combinedName.includes('http://') ||
    combinedName.includes('https://') ||
    combinedName.includes('www.') ||
    combinedName.includes('<a') ||
    combinedName.includes('href=')
  ) {
    return { isSpam: true, reason: 'URL or HTML injection in name fields' };
  }

  // 5. Bot gibberish name check
  const botNames = ['asdf', 'qwerty', 'test test', 'anonymous', 'null null', 'undefined'];
  if (botNames.includes(combinedName.trim())) {
    return { isSpam: true, reason: 'Obvious test/bot placeholder name' };
  }

  // 6. Invalid phone pattern
  const digits = normalizePhone(phone);
  if (digits.length > 0) {
    for (const pattern of INVALID_PHONE_PATTERNS) {
      if (pattern.test(digits)) {
        return { isSpam: true, reason: 'Dummy phone pattern (' + digits + ')' };
      }
    }
    if (digits.length < 7) {
      return { isSpam: true, reason: 'Phone number too short (under 7 digits)' };
    }
  }

  return { isSpam: false, reason: null };
}

/**
 * Checks database for duplicate leads under the same client
 */
export async function checkDuplicate(
  prisma: PrismaClient,
  clientId: string,
  email: string,
  phone?: string | null
): Promise<{ isDuplicate: boolean; duplicateCount: number }> {
  const normalizedP = normalizePhone(phone);
  const cleanEmail = email.toLowerCase().trim();

  const conditions: any[] = [];
  if (cleanEmail && cleanEmail !== 'n/a' && cleanEmail.includes('@')) {
    conditions.push({ email: { equals: cleanEmail } });
  }

  if (normalizedP && normalizedP.length >= 10) {
    const last10 = normalizedP.slice(-10);
    conditions.push({ phone: { contains: last10 } });
  }

  if (conditions.length === 0) {
    return { isDuplicate: false, duplicateCount: 0 };
  }

  const existingMatches = await prisma.lead.count({
    where: {
      clientId,
      OR: conditions,
    },
  });

  return {
    isDuplicate: existingMatches > 0,
    duplicateCount: existingMatches,
  };
}

/**
 * Extracts and determines best timezone for the lead
 */
export function resolveLeadTimezone(
  rawPayload: Record<string, any>,
  clientTimezone?: string | null
): string {
  const tzKeys = ['timezone', 'time_zone', 'tz', 'lead_timezone', 'user_timezone', 'client_timezone'];
  for (const k of tzKeys) {
    if (rawPayload[k] && typeof rawPayload[k] === 'string' && rawPayload[k].trim()) {
      return rawPayload[k].trim();
    }
  }

  return clientTimezone || 'UTC';
}

/**
 * Main quality analysis orchestrator
 */
export async function analyzeLeadQuality(params: AnalyzeLeadParams): Promise<LeadQualityAnalysis> {
  const { prisma, clientId, email, phone, firstName, lastName, rawPayload, clientTimezone } = params;

  // 1. Detect Spam
  const spamCheck = detectSpam(email, phone || '', firstName, lastName || '', rawPayload);

  // 2. Check Deduplication
  const dupCheck = await checkDuplicate(prisma, clientId, email, phone);

  // 3. Determine Timezone
  const detectedTimezone = resolveLeadTimezone(rawPayload, clientTimezone);

  // 4. Calculate Score
  let score = 40;

  const isGoodEmail = email && email.includes('@') && email !== 'n/a' && !spamCheck.isSpam;
  if (isGoodEmail) score += 20;

  const digits = normalizePhone(phone);
  if (digits.length >= 10 && !spamCheck.isSpam) score += 20;

  if (firstName && firstName !== 'Anonymous' && lastName && lastName.trim() !== '') {
    score += 10;
  }

  const hasAttribution = Boolean(
    rawPayload.utm_source ||
    rawPayload.utm_campaign ||
    rawPayload.landing_page ||
    rawPayload.source ||
    rawPayload['Jornaya ID'] ||
    rawPayload.jornaya_lead_id ||
    rawPayload['TF Link'] ||
    rawPayload.trusted_form_cert_url
  );
  if (hasAttribution) score += 10;

  if (dupCheck.isDuplicate) {
    score = Math.max(20, score - 25);
  }

  if (spamCheck.isSpam) {
    score = Math.min(20, Math.max(5, score - 50));
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let qualityGrade: 'A' | 'B' | 'C' | 'D' | 'SPAM' = 'C';
  if (spamCheck.isSpam || score < 30) {
    qualityGrade = 'SPAM';
  } else if (score >= 85) {
    qualityGrade = 'A';
  } else if (score >= 70) {
    qualityGrade = 'B';
  } else if (score >= 50) {
    qualityGrade = 'C';
  } else {
    qualityGrade = 'D';
  }

  return {
    score,
    qualityGrade,
    isDuplicate: dupCheck.isDuplicate,
    duplicateCount: dupCheck.duplicateCount,
    isSpam: spamCheck.isSpam,
    spamReason: spamCheck.reason,
    detectedTimezone,
  };
}
