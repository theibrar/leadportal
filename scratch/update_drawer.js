const fs = require('fs');
const filePath = 'c:/Users/Administrator/Desktop/Working Projects/Ibrasoft_leadportal/src/components/LeadDetailDrawer.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove MessageSquare and Phone from imports if present
content = content.replace(
  /import \{([\s\S]*?)\} from 'lucide-react';/,
  (match, p1) => {
    let icons = p1.replace(/\bPhone\b,?\s*/g, '').replace(/\bMessageSquare\b,?\s*/g, '');
    if (!icons.includes('Copy')) icons += '\n  Copy,';
    if (!icons.includes('Check')) icons += '\n  Check,';
    return `import {${icons}} from 'lucide-react';`;
  }
);

// 2. Add copiedKey state and handleCopyValue function
const copyHelper = `  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyValue = (val: string, keyName: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(val);
    } else {
      const el = document.createElement('textarea');
      el.value = val;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedKey(keyName);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === keyName ? null : prev));
    }, 1500);
  };
`;

if (!content.includes('copiedKey')) {
  content = content.replace(
    /const \[addingTask, setAddingTask\] = useState\(false\);/,
    `const [addingTask, setAddingTask] = useState(false);\n${copyHelper}`
  );
}

// 3. Remove cleanPhone / whatsAppUrl calculation
content = content.replace(
  /\s*\/\/ Phone clean for WhatsApp[\s\S]*?const whatsAppUrl = cleanPhone[\s\S]*?: null;/,
  ''
);

// 4. Update Action Bar to remove WhatsApp and Call, keeping only Email
const oldActionBarRegex = /\{\/\* Action Bar \(Call \/ WhatsApp \/ Email\) \*\/\}[\s\S]*?\{\/\* Status Pipeline Bar \*\/\}/;
const newActionBar = `{/* Action Bar (Email & Timestamp) */}
        <div className="px-6 py-3 bg-blue-50/70 border-b border-blue-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentLead.email && currentLead.email !== 'N/A' && (
              <a
                href={\`mailto:\${currentLead.email}\`}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-all"
                title={\`Send email to \${currentLead.email}\`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" /> Email
              </a>
            )}
          </div>

          {/* Timestamp & Timezone with 1-Click Copy */}
          <TimestampCopyBadge
            date={currentLead.createdAt}
            timezone={currentLead.timezone}
            leadName={\`\${currentLead.firstName} \${currentLead.lastName || ''}\`}
            leadEmail={currentLead.email}
          />
        </div>

        {/* Status Pipeline Bar */}`;

content = content.replace(oldActionBarRegex, newActionBar);

// 5. Update Contact Information fields to have 1-click copy buttons
const oldContactInfoRegex = /\{\/\* Lead Contact Info \*\/\}[\s\S]*?\{\/\* Extracted Marketing Parameters \*\/\}/;
const newContactInfo = `{/* Lead Contact Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Full Name</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">{currentLead.firstName} {currentLead.lastName || ''}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyValue(\`\${currentLead.firstName} \${currentLead.lastName || ''}\`.trim(), 'fullName')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                      title={copiedKey === 'fullName' ? 'Copied!' : 'Copy Full Name'}
                    >
                      {copiedKey === 'fullName' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                      <p className="font-mono font-bold text-blue-600 mt-0.5 select-all truncate">{currentLead.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyValue(currentLead.email, 'email')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                      title={copiedKey === 'email' ? 'Copied!' : 'Copy Email'}
                    >
                      {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Phone Number</span>
                      <p className="font-mono font-bold text-slate-800 mt-0.5 select-all truncate">{currentLead.phone || 'N/A'}</p>
                    </div>
                    {currentLead.phone && (
                      <button
                        type="button"
                        onClick={() => handleCopyValue(currentLead.phone, 'phone')}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                        title={copiedKey === 'phone' ? 'Copied!' : 'Copy Phone'}
                      >
                        {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Captured Time & Timezone</span>
                      <p className="font-mono font-bold text-slate-800 mt-0.5 truncate">
                        {new Date(currentLead.createdAt).toLocaleString()} [{currentLead.timezone || 'UTC'}]
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyValue(\`\${new Date(currentLead.createdAt).toLocaleString()} [\${currentLead.timezone || 'UTC'}]\`, 'createdAt')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                      title={copiedKey === 'createdAt' ? 'Copied!' : 'Copy Captured Time'}
                    >
                      {copiedKey === 'createdAt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Extracted Marketing Parameters */}`;

content = content.replace(oldContactInfoRegex, newContactInfo);

// 6. Update Key Form & Attribution Fields to include 1-click copy buttons
const oldCustomJsonRegex = /\{\/\* Extracted Marketing Parameters \*\/\}[\s\S]*?\{customJson && \([\s\S]*?\{Object\.entries\(customJson\)\.map\(\(\[k, v\]\) => \{[\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\}/;
const newCustomJson = `{/* Extracted Marketing Parameters */}
              {customJson && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Form & Attribution Fields</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(customJson).map(([k, v]) => {
                      if (typeof v === 'object') return null;
                      return (
                        <div key={k} className="p-2.5 bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200 rounded-lg flex items-center justify-between gap-2 group">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{k}</span>
                            <span className="font-medium text-slate-800 truncate select-all" title={String(v)}>
                              {String(v)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyValue(String(v), k)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                            title={copiedKey === k ? 'Copied!' : \`Copy \${k}\`}
                          >
                            {copiedKey === k ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}`;

content = content.replace(oldCustomJsonRegex, newCustomJson);

// 7. Fix ?? SPAM
content = content.replace(/\?\? SPAM/g, '⚠️ SPAM');

fs.writeFileSync(filePath, content, 'utf8');
console.log('LeadDetailDrawer successfully updated!');
