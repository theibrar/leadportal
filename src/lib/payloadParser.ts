/**
 * Flexible payload parser for webhooks and form submissions.
 * Handles variations in field naming across CRM systems, landing pages,
 * and form builders (e.g., full_name, mobile_phone, email_address, etc.)
 */

export interface ExtractedLeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
}

export function extractLeadFields(rawPayload: Record<string, any>): ExtractedLeadData {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return {
      firstName: 'Anonymous',
      lastName: '',
      email: 'N/A',
      phone: '',
      source: 'WEBHOOK_LANDING_PAGE',
    };
  }

  // Case-insensitive key lookup helper
  const getVal = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      if (rawPayload[key] !== undefined && rawPayload[key] !== null) {
        const str = String(rawPayload[key]).trim();
        if (str !== '') return str;
      }
    }
    // Case-insensitive / normalized search
    const lowerKeys = keys.map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
    for (const pKey of Object.keys(rawPayload)) {
      const normalizedPKey = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lowerKeys.includes(normalizedPKey)) {
        const val = rawPayload[pKey];
        if (val !== undefined && val !== null) {
          const str = String(val).trim();
          if (str !== '') return str;
        }
      }
    }
    return undefined;
  };

  // 1. Email extraction
  const email =
    getVal(
      'email',
      'email_address',
      'emailAddress',
      'contact_email',
      'mail',
      'user_email',
      'applicant_email',
      'client_email'
    ) || 'N/A';

  // 2. Phone extraction
  const phone =
    getVal(
      'phone',
      'mobile_phone',
      'mobilePhone',
      'contact_phone',
      'mobile',
      'phoneNumber',
      'phone_number',
      'cell_phone',
      'cellphone',
      'telephone',
      'user_phone',
      'phone_num'
    ) || '';

  // 3. Name extraction
  let firstName = getVal('firstName', 'first_name', 'firstname', 'fname');
  let lastName = getVal('lastName', 'last_name', 'lastname', 'lname') || '';

  const fullName = getVal(
    'full_name',
    'fullName',
    'fullname',
    'name',
    'contact_name',
    'client_name',
    'user_name',
    'applicant_name'
  );

  if (!firstName && fullName) {
    const parts = fullName.trim().split(/\s+/);
    firstName = parts[0];
    if (!lastName && parts.length > 1) {
      lastName = parts.slice(1).join(' ');
    }
  }

  if (!firstName) {
    firstName = 'Anonymous';
  }

  // 4. Source extraction
  const source =
    getVal('source', 'utm_source', 'page_url', 'landing_page', 'lead_source') || 'WEBHOOK_LANDING_PAGE';

  return {
    firstName,
    lastName,
    email,
    phone,
    source,
  };
}
