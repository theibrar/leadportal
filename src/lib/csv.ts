/**
 * Converts array of lead objects to a clean, fully-flattened CSV.
 * - Extracts and creates dedicated columns for all custom payload fields & UTM parameters (no raw JSON dumping)
 * - Includes UTF-8 BOM (\uFEFF) for 100% compatibility with Microsoft Excel, Google Sheets, and Numbers
 * - Sanitizes against formula injection (=, +, -, @) and cleans newlines
 */
export function generateLeadsCSV(leads: any[]): string {
  if (!leads || leads.length === 0) {
    return '\uFEFFLead ID,First Name,Last Name,Email,Phone,Status,Quality Grade,Campaign,Date\n';
  }

  // Keys already handled as dedicated standard columns
  const standardKeysIgnored = new Set([
    'firstname',
    'first_name',
    'lastname',
    'last_name',
    'name',
    'email',
    'emailaddress',
    'email_address',
    'phone',
    'phonenumber',
    'phone_number',
    'source',
    'status',
    'rawbody',
    'bot_trap',
    'bottrap',
    'website_hp',
    'honeypot',
    'hp_field',
  ]);

  // Parse customData for each lead and gather all unique custom keys
  const parsedCustomList: Array<Record<string, any>> = [];
  const dynamicKeysSet = new Set<string>();

  leads.forEach((l) => {
    let customObj: Record<string, any> = {};
    if (l.customData) {
      if (typeof l.customData === 'object' && l.customData !== null) {
        customObj = l.customData;
      } else if (typeof l.customData === 'string') {
        try {
          customObj = JSON.parse(l.customData);
        } catch {
          // If query string or plain string
          customObj = { rawNotes: l.customData };
        }
      }
    }

    parsedCustomList.push(customObj);

    // Collect all dynamic keys
    Object.keys(customObj).forEach((k) => {
      const lower = k.toLowerCase().replace(/[\s_-]/g, '');
      if (!standardKeysIgnored.has(lower) && !standardKeysIgnored.has(k.toLowerCase())) {
        dynamicKeysSet.add(k);
      }
    });
  });

  // Sort dynamic keys: UTMs first, then alphabetical
  const dynamicKeys = Array.from(dynamicKeysSet).sort((a, b) => {
    const aIsUtm = a.toLowerCase().startsWith('utm_');
    const bIsUtm = b.toLowerCase().startsWith('utm_');
    if (aIsUtm && !bIsUtm) return -1;
    if (!aIsUtm && bIsUtm) return 1;
    return a.localeCompare(b);
  });

  // Humanize header names (e.g. utm_source -> UTM Source, accident_date -> Accident Date)
  function formatHeader(key: string): string {
    if (key.toLowerCase().startsWith('utm_')) {
      return 'UTM ' + key.substring(4).charAt(0).toUpperCase() + key.substring(5);
    }
    return key
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  // Base standard headers
  const baseHeaders = [
    'Lead ID',
    'First Name',
    'Last Name',
    'Email Address',
    'Phone Number',
    'Pipeline Status',
    'Quality Grade',
    'Quality Score',
    'Campaign Name',
    'Campaign Code',
    'Client Account',
    'Lead Source',
    'Duplicate Flag',
    'Duplicate Count',
    'Spam Flag',
    'Timezone',
    'IP Address',
    'Created At (UTC)',
    'Created Date (Local)',
  ];

  // Combined headers
  const allHeaders = [...baseHeaders, ...dynamicKeys.map(formatHeader)];

  // Cell Sanitizer
  function sanitize(val: any): string {
    if (val === null || val === undefined) return '""';
    if (typeof val === 'object') {
      try {
        val = JSON.stringify(val);
      } catch {
        val = String(val);
      }
    }

    // Convert to string and remove line breaks so Excel rows do not break
    let str = String(val).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
    // Escape quotes
    str = str.replace(/"/g, '""');

    // Formula injection defense (=, +, -, @, \t)
    if (['=', '+', '-', '@', '\t'].some((char) => str.startsWith(char))) {
      str = "'" + str;
    }
    return `"${str}"`;
  }

  // Build rows
  const rows = leads.map((l, idx) => {
    const custom = parsedCustomList[idx] || {};

    const localDateStr = l.createdAt
      ? new Date(l.createdAt).toLocaleString(undefined, {
          timeZone: l.timezone && l.timezone !== 'UTC' ? l.timezone : undefined,
        })
      : '';

    const baseValues = [
      sanitize(l.id),
      sanitize(l.firstName),
      sanitize(l.lastName || ''),
      sanitize(l.email),
      sanitize(l.phone || ''),
      sanitize(l.status || 'NEW'),
      sanitize(l.qualityGrade || 'A'),
      sanitize(l.score !== undefined ? `${l.score}` : '100'),
      sanitize(l.campaign?.name || ''),
      sanitize(l.campaign?.code || ''),
      sanitize(l.client?.name || ''),
      sanitize(l.source || 'WEBHOOK'),
      sanitize(l.isDuplicate ? 'YES' : 'NO'),
      sanitize(l.duplicateCount || 0),
      sanitize(l.isSpam ? 'SPAM' : 'NO'),
      sanitize(l.timezone || 'UTC'),
      sanitize(l.ipAddress || ''),
      sanitize(l.createdAt ? new Date(l.createdAt).toISOString() : ''),
      sanitize(localDateStr),
    ];

    // Dynamic field values
    const dynamicValues = dynamicKeys.map((k) => {
      const val = custom[k];
      return sanitize(val !== undefined ? val : '');
    });

    return [...baseValues, ...dynamicValues];
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens all columns properly
  const bom = '\uFEFF';
  const csvBody = [allHeaders.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  return bom + csvBody;
}
