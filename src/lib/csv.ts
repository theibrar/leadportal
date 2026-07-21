/**
 * Converts array of lead objects to CSV with injection sanitization.
 */
export function generateLeadsCSV(leads: any[]): string {
  const headers = [
    'Lead ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Source',
    'Status',
    'Campaign Name',
    'Client Name',
    'Received Date',
    'Custom Data JSON',
  ];

  function sanitize(val: any): string {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    // Formula injection defense (=, +, -, @)
    if (['=', '+', '-', '@', '\t', '\r'].some((char) => str.startsWith(char))) {
      str = "'" + str;
    }
    return `"${str}"`;
  }

  const rows = leads.map((l) => [
    sanitize(l.id),
    sanitize(l.firstName),
    sanitize(l.lastName || ''),
    sanitize(l.email),
    sanitize(l.phone || ''),
    sanitize(l.source || 'WEBHOOK'),
    sanitize(l.status || 'NEW'),
    sanitize(l.campaign?.name || ''),
    sanitize(l.client?.name || ''),
    sanitize(new Date(l.createdAt).toISOString()),
    sanitize(l.customData || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
