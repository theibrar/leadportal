(function () {
  'use strict';

  // Find the executing script tag to extract configuration
  const currentScript =
    document.currentScript ||
    (function () {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  const webhookToken = currentScript ? currentScript.getAttribute('data-token') : null;
  if (!webhookToken) {
    console.warn('[LeadFlow] Script tag missing required data-token attribute.');
    return;
  }

  // Configuration options with sensible defaults
  const mode = currentScript.getAttribute('data-mode') || 'multistep'; // 'multistep' | 'simple' | 'popup'
  const title = currentScript.getAttribute('data-title') || 'Get in Touch';
  const subtitle = currentScript.getAttribute('data-subtitle') || 'Fill in the form below and we will contact you shortly.';
  const buttonText = currentScript.getAttribute('data-button') || 'Submit Request';
  const primaryColor = currentScript.getAttribute('data-color') || '#2563eb';
  const popupLabel = currentScript.getAttribute('data-popup-label') || 'Request a Quote';
  const containerId = currentScript.getAttribute('data-container-id') || null;

  // Determine API endpoint base
  let baseUrl = '';
  try {
    const scriptSrc = currentScript.src;
    if (scriptSrc) {
      const parsed = new URL(scriptSrc);
      baseUrl = parsed.origin;
    }
  } catch (e) {
    baseUrl = window.location.origin;
  }
  const endpointUrl = baseUrl + '/api/webhooks/ingest/' + webhookToken;

  // Automatically harvest marketing attribution & URL parameters
  function getUrlParams() {
    const params = {};
    try {
      const search = window.location.search.substring(1);
      if (search) {
        const pairs = search.split('&');
        for (let i = 0; i < pairs.length; i++) {
          const parts = pairs[i].split('=');
          if (parts[0]) {
            params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
          }
        }
      }
      params.page_url = window.location.href;
      params.page_title = document.title;
      params.referrer = document.referrer || '';
    } catch (e) {}
    return params;
  }

  // Unique container styling
  const styleId = 'leadflow-widget-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .lf-widget-root {
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-sizing: border-box;
        color: #1e293b;
      }
      .lf-widget-root * {
        box-sizing: border-box;
      }
      .lf-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
        padding: 24px;
        max-width: 460px;
        width: 100%;
        margin: 0 auto;
      }
      .lf-header {
        margin-bottom: 20px;
        text-align: left;
      }
      .lf-title {
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 6px 0;
        letter-spacing: -0.02em;
      }
      .lf-subtitle {
        font-size: 13px;
        color: #64748b;
        margin: 0;
        line-height: 1.4;
      }
      .lf-step-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 18px;
      }
      .lf-step-dot {
        flex: 1;
        height: 4px;
        background: #e2e8f0;
        border-radius: 9999px;
        transition: background 0.3s ease;
      }
      .lf-step-dot.lf-active {
        background: ${primaryColor};
      }
      .lf-field-group {
        margin-bottom: 14px;
      }
      .lf-label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: #334155;
        margin-bottom: 6px;
      }
      .lf-input {
        width: 100%;
        padding: 10px 14px;
        font-size: 13px;
        border: 1.5px solid #cbd5e1;
        border-radius: 10px;
        background: #f8fafc;
        color: #0f172a;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .lf-input:focus {
        border-color: ${primaryColor};
        background: #ffffff;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
      }
      .lf-btn-row {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      .lf-btn {
        flex: 1;
        padding: 12px 18px;
        font-size: 13px;
        font-weight: 700;
        color: #ffffff;
        background: ${primaryColor};
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: opacity 0.2s, transform 0.1s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .lf-btn:hover {
        opacity: 0.92;
      }
      .lf-btn:active {
        transform: scale(0.98);
      }
      .lf-btn-secondary {
        background: #f1f5f9;
        color: #475569;
      }
      .lf-btn-secondary:hover {
        background: #e2e8f0;
      }
      .lf-hp {
        position: absolute !important;
        left: -9999px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
      }
      .lf-success {
        text-align: center;
        padding: 30px 10px;
      }
      .lf-success-icon {
        width: 56px;
        height: 56px;
        background: #ecfdf5;
        border: 2px solid #10b981;
        color: #10b981;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px auto;
        font-size: 26px;
        font-weight: bold;
      }
      .lf-error-box {
        padding: 10px 14px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 14px;
      }
      .lf-branding {
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
        font-weight: 600;
        margin-top: 16px;
      }
      .lf-branding a {
        color: #64748b;
        text-decoration: none;
      }
      .lf-branding a:hover {
        text-decoration: underline;
      }
      /* Floating Popup Styles */
      .lf-popup-trigger {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999998;
        background: ${primaryColor};
        color: #ffffff;
        border: none;
        border-radius: 50px;
        padding: 14px 22px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .lf-popup-trigger:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25);
      }
      .lf-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .lf-modal-card {
        position: relative;
        width: 100%;
        max-width: 480px;
      }
      .lf-close-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        background: #f1f5f9;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        font-weight: bold;
        font-size: 16px;
      }
      .lf-close-btn:hover {
        background: #e2e8f0;
        color: #0f172a;
      }
    `;
    document.head.appendChild(style);
  }

  // Construct Form Elements
  function createForm() {
    const root = document.createElement('div');
    root.className = 'lf-widget-root';

    const card = document.createElement('div');
    card.className = 'lf-card';

    // State
    let currentStep = 1;
    const totalSteps = mode === 'multistep' ? 3 : 1;
    const formData = {
      serviceInterest: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
      bot_trap: '',
    };

    // Header
    const header = document.createElement('div');
    header.className = 'lf-header';
    header.innerHTML = `
      <h3 class="lf-title">${title}</h3>
      <p class="lf-subtitle">${subtitle}</p>
    `;
    card.appendChild(header);

    // Step Indicator for Multistep
    let stepIndicator = null;
    if (mode === 'multistep') {
      stepIndicator = document.createElement('div');
      stepIndicator.className = 'lf-step-indicator';
      for (let i = 1; i <= totalSteps; i++) {
        const dot = document.createElement('div');
        dot.className = 'lf-step-dot' + (i === 1 ? ' lf-active' : '');
        dot.id = 'lf-dot-' + i;
        stepIndicator.appendChild(dot);
      }
      card.appendChild(stepIndicator);
    }

    // Error Box
    const errorBox = document.createElement('div');
    errorBox.className = 'lf-error-box';
    errorBox.style.display = 'none';
    card.appendChild(errorBox);

    // Form Container
    const form = document.createElement('form');
    form.onsubmit = function (e) {
      e.preventDefault();
    };

    // Honeypot Field (invisible bot trap)
    const hp = document.createElement('input');
    hp.type = 'text';
    hp.name = 'bot_trap';
    hp.className = 'lf-hp';
    hp.tabIndex = -1;
    hp.autocomplete = 'off';
    hp.oninput = function (e) {
      formData.bot_trap = e.target.value;
    };
    form.appendChild(hp);

    // Step 1: Inquire or Requirement (for multistep)
    const step1Container = document.createElement('div');
    step1Container.id = 'lf-step-1';
    if (mode === 'multistep') {
      step1Container.innerHTML = `
        <div class="lf-field-group">
          <label class="lf-label">What service or inquiry can we help with?</label>
          <select id="lf-interest" class="lf-input">
            <option value="General Inquiry">General Information & Pricing</option>
            <option value="Sales / Quote Request">Request an Official Quote</option>
            <option value="Consultation">Schedule a Direct Consultation</option>
            <option value="Partnership">Partnership & Collaboration</option>
            <option value="Other">Other Specific Need</option>
          </select>
        </div>
        <div class="lf-field-group">
          <label class="lf-label">Briefly describe your request (optional)</label>
          <input type="text" id="lf-notes-init" class="lf-input" placeholder="e.g. Need service within 2 weeks" />
        </div>
      `;
    }

    // Step 2: Name & Email
    const step2Container = document.createElement('div');
    step2Container.id = 'lf-step-2';
    if (mode === 'multistep') {
      step2Container.style.display = 'none';
    }
    step2Container.innerHTML = `
      <div style="display:flex; gap:10px;">
        <div class="lf-field-group" style="flex:1;">
          <label class="lf-label">First Name *</label>
          <input type="text" id="lf-first-name" class="lf-input" placeholder="John" required />
        </div>
        <div class="lf-field-group" style="flex:1;">
          <label class="lf-label">Last Name</label>
          <input type="text" id="lf-last-name" class="lf-input" placeholder="Doe" />
        </div>
      </div>
      <div class="lf-field-group">
        <label class="lf-label">Email Address *</label>
        <input type="email" id="lf-email" class="lf-input" placeholder="john@example.com" required />
      </div>
    `;

    // Step 3: Phone & Final Comments
    const step3Container = document.createElement('div');
    step3Container.id = 'lf-step-3';
    if (mode === 'multistep') {
      step3Container.style.display = 'none';
    }
    step3Container.innerHTML = `
      <div class="lf-field-group">
        <label class="lf-label">Phone Number *</label>
        <input type="tel" id="lf-phone" class="lf-input" placeholder="(555) 000-0000" required />
      </div>
      ${
        mode === 'simple'
          ? `
        <div class="lf-field-group">
          <label class="lf-label">How can we help you?</label>
          <textarea id="lf-notes" class="lf-input" rows="2" placeholder="Tell us more about your inquiry..."></textarea>
        </div>
      `
          : ''
      }
    `;

    form.appendChild(step1Container);
    form.appendChild(step2Container);
    form.appendChild(step3Container);

    // Button Row
    const btnRow = document.createElement('div');
    btnRow.className = 'lf-btn-row';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'lf-btn lf-btn-secondary';
    backBtn.textContent = '← Back';
    backBtn.style.display = 'none';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'lf-btn';
    nextBtn.textContent = mode === 'multistep' ? 'Next Step →' : buttonText;

    btnRow.appendChild(backBtn);
    btnRow.appendChild(nextBtn);
    form.appendChild(btnRow);

    // Update Step UI
    function updateStepUI() {
      errorBox.style.display = 'none';
      if (mode === 'multistep') {
        step1Container.style.display = currentStep === 1 ? 'block' : 'none';
        step2Container.style.display = currentStep === 2 ? 'block' : 'none';
        step3Container.style.display = currentStep === 3 ? 'block' : 'none';

        backBtn.style.display = currentStep > 1 ? 'block' : 'none';
        nextBtn.textContent = currentStep === 3 ? buttonText : 'Next Step →';

        for (let i = 1; i <= 3; i++) {
          const dot = card.querySelector('#lf-dot-' + i);
          if (dot) {
            if (i <= currentStep) {
              dot.classList.add('lf-active');
            } else {
              dot.classList.remove('lf-active');
            }
          }
        }
      }
    }

    backBtn.onclick = function () {
      if (currentStep > 1) {
        currentStep--;
        updateStepUI();
      }
    };

    nextBtn.onclick = async function () {
      errorBox.style.display = 'none';

      // Harvest inputs
      const fnEl = card.querySelector('#lf-first-name');
      const lnEl = card.querySelector('#lf-last-name');
      const emEl = card.querySelector('#lf-email');
      const phEl = card.querySelector('#lf-phone');
      const intEl = card.querySelector('#lf-interest');
      const ntInitEl = card.querySelector('#lf-notes-init');
      const ntEl = card.querySelector('#lf-notes');

      if (fnEl) formData.firstName = fnEl.value.trim();
      if (lnEl) formData.lastName = lnEl.value.trim();
      if (emEl) formData.email = emEl.value.trim();
      if (phEl) formData.phone = phEl.value.trim();
      if (intEl) formData.serviceInterest = intEl.value;
      if (ntInitEl) formData.notes = ntInitEl.value.trim();
      if (ntEl && ntEl.value.trim()) formData.notes = (formData.notes ? formData.notes + ' | ' : '') + ntEl.value.trim();

      // Multistep Step 1 Validation
      if (mode === 'multistep' && currentStep === 1) {
        currentStep = 2;
        updateStepUI();
        return;
      }

      // Step 2 Validation
      if (mode === 'multistep' && currentStep === 2) {
        if (!formData.firstName) {
          showError('Please enter your first name.');
          if (fnEl) fnEl.focus();
          return;
        }
        if (!formData.email || !formData.email.includes('@')) {
          showError('Please enter a valid email address.');
          if (emEl) emEl.focus();
          return;
        }
        currentStep = 3;
        updateStepUI();
        return;
      }

      // Final Step Submission Validation
      if (!formData.firstName) {
        showError('Please enter your first name.');
        return;
      }
      if (!formData.email || !formData.email.includes('@')) {
        showError('Please enter a valid email address.');
        return;
      }
      if (!formData.phone || formData.phone.length < 7) {
        showError('Please enter a valid phone number.');
        if (phEl) phEl.focus();
        return;
      }

      // Submission Payload
      nextBtn.disabled = true;
      nextBtn.textContent = 'Submitting...';

      const urlParams = getUrlParams();
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        service_interest: formData.serviceInterest,
        inquiry_notes: formData.notes,
        bot_trap: formData.bot_trap,
        source: 'EMBED_WIDGET',
        ...urlParams,
      };

      try {
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showSuccess();
        } else {
          showError(data.error || 'Unable to submit your request. Please try again.');
          nextBtn.disabled = false;
          nextBtn.textContent = buttonText;
        }
      } catch (err) {
        showError('Network error connecting to the server. Please check your connection.');
        nextBtn.disabled = false;
        nextBtn.textContent = buttonText;
      }
    };

    function showError(msg) {
      errorBox.textContent = msg;
      errorBox.style.display = 'block';
    }

    function showSuccess() {
      card.innerHTML = `
        <div class="lf-success">
          <div class="lf-success-icon">✓</div>
          <h3 class="lf-title" style="margin-bottom:8px;">Thank You, ${formData.firstName}!</h3>
          <p class="lf-subtitle">Your request has been received. Our specialist will be in touch with you shortly.</p>
        </div>
        <div class="lf-branding">
          Powered by <a href="http://ibrasoft.com" target="_blank" rel="noopener">LeadFlow Portal</a>
        </div>
      `;
    }

    card.appendChild(form);

    // Branding Footer
    const branding = document.createElement('div');
    branding.className = 'lf-branding';
    branding.innerHTML = `Protected & Verified by <a href="http://ibrasoft.com" target="_blank" rel="noopener">LeadFlow Engine</a>`;
    card.appendChild(branding);

    root.appendChild(card);
    return root;
  }

  // Render Strategy
  if (mode === 'popup') {
    // 1. Floating trigger button
    const trigger = document.createElement('button');
    trigger.className = 'lf-widget-root lf-popup-trigger';
    trigger.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span>${popupLabel}</span>
    `;
    document.body.appendChild(trigger);

    // 2. Modal Backdrop (hidden initially)
    let backdrop = null;

    trigger.onclick = function () {
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'lf-widget-root lf-modal-backdrop';

        const modalCard = document.createElement('div');
        modalCard.className = 'lf-modal-card';

        const formNode = createForm();

        const closeBtn = document.createElement('button');
        closeBtn.className = 'lf-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = function () {
          backdrop.style.display = 'none';
        };

        modalCard.appendChild(closeBtn);
        modalCard.appendChild(formNode);
        backdrop.appendChild(modalCard);

        backdrop.onclick = function (e) {
          if (e.target === backdrop) {
            backdrop.style.display = 'none';
          }
        };

        document.body.appendChild(backdrop);
      } else {
        backdrop.style.display = 'flex';
      }
    };
  } else {
    // Inline mode
    const targetEl = containerId ? document.getElementById(containerId) : null;
    const formNode = createForm();
    if (targetEl) {
      targetEl.appendChild(formNode);
    } else if (currentScript && currentScript.parentNode) {
      currentScript.parentNode.insertBefore(formNode, currentScript.nextSibling);
    } else {
      document.body.appendChild(formNode);
    }
  }
})();
