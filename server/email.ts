// src/email.ts
import 'dotenv/config';
import nodemailer, { Transporter } from 'nodemailer';
import crypto from 'node:crypto';

export type SubmissionEmailPayload = {
  name: string;
  email: string;
  projectTitle: string;
  projectDescription: string;
  projectType: string;
  budget: string;
  aiAnalysis?: {
    summary?: string;
    category?: string;
    estimatedComplexity?: string;
  } | null;
};

/* ---------------------------
   Transporter and helpers
   --------------------------- */

function getTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

  if (!host || !user || !pass) {
    throw new Error(
      'Missing SMTP configuration. Set SMTP_HOST, SMTP_USER, SMTP_PASS (and optionally SMTP_PORT, SMTP_SECURE).'
    );
  }

  const debugEnabled = (process.env.SMTP_DEBUG || '').toLowerCase() === 'true';

  // Note: Gmail can be slow to accept connections on cold starts.
  // A too-low connectionTimeout causes false "Connection timeout" failures.
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    connectionTimeout: 60_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
    logger: debugEnabled,
    debug: debugEnabled,
  });
}

function getFromAddress() {
  const brand = process.env.EMAIL_FROM_NAME || 'Project Catalyst';

  // Allow either:
  // - EMAIL_FROM="Your Name <you@example.com>" (already formatted)
  // - EMAIL_FROM="you@example.com" (we'll add the display name)
  const configured = (process.env.EMAIL_FROM || '').trim();
  if (configured && configured.includes('<') && configured.includes('>')) {
    return configured;
  }

  const email = configured || process.env.SMTP_USER || 'no-reply@example.com';
  return `"${brand}" <${email}>`;
}

function makeSubmissionId() {
  return crypto.randomUUID();
}

/* ---------------------------
   Escaping helpers
   --------------------------- */

function escapeHtml(str: string | undefined | null) {
  const s = String(str ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str: string | undefined | null) {
  return escapeHtml(String(str ?? '')).replace(/\r?\n/g, ' ');
}

/* ---------------------------
   Existing admin templates (kept simple)
   --------------------------- */

function makeHtml(
  payload: SubmissionEmailPayload,
  opts?: { headerCid?: string; headerUrl?: string; brandColor?: string; brandName?: string }
) {
  const analysis = payload.aiAnalysis;
  const brandColor = opts?.brandColor || process.env.BRAND_COLOR || '#0f766e';
  const brandName = opts?.brandName || process.env.EMAIL_FROM_NAME || 'Project Catalyst';
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,&quot;Helvetica Neue&quot;,Noto Sans,sans-serif;line-height:1.5">
    ${opts?.headerUrl ? `
      <div style="max-width:640px;margin:0 auto;border-radius:12px;overflow:hidden">
        <img src="${escapeAttr(opts.headerUrl)}" alt="${escapeAttr(brandName)}" style="display:block;width:100%;height:auto;border:0"/>
      </div>
    ` : opts?.headerCid ? `
      <div style="max-width:640px;margin:0 auto;border-radius:12px;overflow:hidden">
        <img src="cid:${escapeAttr(opts.headerCid)}" alt="${escapeAttr(brandName)}" style="display:block;width:100%;height:auto;border:0"/>
      </div>
    ` : `
      <div style="max-width:640px;margin:0 auto;background:${brandColor};color:#fff;padding:10px 16px;border-radius:12px">
        <strong>${escapeHtml(brandName)}</strong>
      </div>
    `}
    <h2 style="margin:0 0 12px">${escapeHtml(payload.projectTitle)}</h2>
    <p style="margin:0 0 8px">From: <strong>${escapeHtml(payload.name)}</strong> &lt;${escapeHtml(payload.email)}&gt;</p>
    <p style="margin:0 0 8px">Type: ${escapeHtml(payload.projectType)} · Budget: ${escapeHtml(payload.budget)}</p>
    <h3 style="margin:16px 0 8px">Description</h3>
    <p style="white-space:pre-wrap">${escapeHtml(payload.projectDescription)}</p>
    ${analysis ? `
      <h3 style="margin:16px 0 8px">AI Analysis</h3>
      <ul>
        ${analysis.summary ? `<li><strong>Summary:</strong> ${escapeHtml(analysis.summary)}</li>` : ''}
        ${analysis.category ? `<li><strong>Category:</strong> ${escapeHtml(analysis.category)}</li>` : ''}
        ${analysis.estimatedComplexity ? `<li><strong>Complexity:</strong> ${escapeHtml(analysis.estimatedComplexity)}</li>` : ''}
      </ul>
    ` : ''}
  </div>
  `;
}

function makeText(payload: SubmissionEmailPayload) {
  const lines = [
    `Project: ${payload.projectTitle}`,
    `From: ${payload.name} <${payload.email}>`,
    `Type: ${payload.projectType}  Budget: ${payload.budget}`,
    '',
    'Description:',
    payload.projectDescription,
  ];
  if (payload.aiAnalysis) {
    lines.push('', 'AI Analysis:');
    if (payload.aiAnalysis.summary) lines.push(`- Summary: ${payload.aiAnalysis.summary}`);
    if (payload.aiAnalysis.category) lines.push(`- Category: ${payload.aiAnalysis.category}`);
    if (payload.aiAnalysis.estimatedComplexity) lines.push(`- Complexity: ${payload.aiAnalysis.estimatedComplexity}`);
  }
  return lines.join('\n');
}

/* ---------------------------
   New client templates (HTML + Text)
   --------------------------- */

function makeClientHtml(
  payload: SubmissionEmailPayload,
  submissionId: string,
  opts?: { headerCid?: string; headerUrl?: string; logoCid?: string }
) {
  const analysis = payload.aiAnalysis;
  const preheader = `Thanks, ${payload.name}! We’ve received “${payload.projectTitle}”.`;
  const brandColor = process.env.BRAND_COLOR || '#0f766e';

  return `
  <div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,Ubuntu,Cantarell,'Helvetica Neue',Noto Sans,sans-serif;line-height:1.6;background:#f6f7f9;padding:24px">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
      ${opts?.headerUrl ? `
        <tr>
          <td style="padding:0;background:#000">
            <img src="${escapeAttr(opts.headerUrl)}" alt="${escapeAttr(process.env.EMAIL_FROM_NAME || 'Project Catalyst')}" width="640" style="display:block;width:100%;height:auto;border:0"/>
          </td>
        </tr>
      ` : opts?.headerCid ? `
        <tr>
          <td style="padding:0;background:#000">
            <img src="cid:${escapeAttr(opts.headerCid)}" alt="${escapeAttr(process.env.EMAIL_FROM_NAME || 'Project Catalyst')}" width="640" style="display:block;width:100%;height:auto;border:0"/>
          </td>
        </tr>
      ` : `
        <tr>
          <td style="padding:20px 24px;background:${brandColor}">
            <table width="100%"><tr>
              <td>
                ${opts?.logoCid ? `<img src="cid:${escapeAttr(opts.logoCid)}" alt="${escapeAttr(process.env.EMAIL_FROM_NAME || 'Project Catalyst')}" height="28" style="display:block;border:0"/>` : `<span style="color:#e0fffb;font-weight:700">${escapeHtml(process.env.EMAIL_FROM_NAME || 'Project Catalyst')}</span>`}
              </td>
              <td align="right" style="color:#e0fffb;font-weight:600">Submission received</td>
            </tr></table>
          </td>
        </tr>
      `}

      <tr>
        <td style="padding:24px">
          <h2 style="margin:0 0 8px;font-size:20px">Thanks, ${escapeHtml(payload.name)}!</h2>
          <p style="margin:0 0 16px">We’ve received your project <strong>${escapeHtml(payload.projectTitle)}</strong>.</p>

          <table role="presentation" width="100%" style="background:#f3f4f6;border-radius:10px;padding:16px;margin:16px 0">
            <tr><td><strong>Submission ID:</strong> ${escapeHtml(submissionId)}</td></tr>
            <tr><td><strong>Type:</strong> ${escapeHtml(payload.projectType)} &nbsp; · &nbsp; <strong>Budget:</strong> ${escapeHtml(payload.budget)}</td></tr>
            <tr><td><strong>Email:</strong> ${escapeHtml(payload.email)}</td></tr>
          </table>

          <h3 style="margin:16px 0 8px">What happens next?</h3>
          <ol style="margin:0 0 16px 20px;padding:0">
            <li>You’ll get a scoping reply within <strong>1–2 business days</strong>.</li>
            <li>If it’s a fit, we’ll propose timelines and milestones.</li>
            <li>Kickoff call to finalize scope and start.</li>
          </ol>

          <div style="margin:20px 0">
            <a href="${escapeAttr(process.env.CLIENT_CTA_URL || 'https://example.com/book')}"
               style="display:inline-block;padding:12px 18px;background:${brandColor};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">
              Book a quick call
            </a>
          </div>

          <h3 style="margin:16px 0 8px">Your description</h3>
          <p style="white-space:pre-wrap;margin:0 0 12px">${escapeHtml(payload.projectDescription)}</p>

          ${analysis ? `
            <h3 style="margin:16px 0 8px">AI Analysis</h3>
            <ul style="margin:0 0 12px 18px;padding:0">
              ${analysis.summary ? `<li><strong>Summary:</strong> ${escapeHtml(analysis.summary)}</li>` : ''}
              ${analysis.category ? `<li><strong>Category:</strong> ${escapeHtml(analysis.category)}</li>` : ''}
              ${analysis.estimatedComplexity ? `<li><strong>Complexity:</strong> ${escapeHtml(analysis.estimatedComplexity)}</li>` : ''}
            </ul>
          ` : ''}

          <p style="margin-top:24px;color:#6b7280;font-size:12px">If anything looks off, reply to this email with updates. We’ll track your update using your Submission ID.</p>
        </td>
      </tr>

      <tr>
        <td style="background:#f9fafb;padding:16px 24px;color:#6b7280;font-size:12px">
          © ${new Date().getFullYear()} ${escapeHtml(process.env.EMAIL_FROM_NAME || 'Project Catalyst')} · ${escapeHtml(process.env.COMPANY_ADDRESS || 'Your City')}
        </td>
      </tr>
    </table>
  </div>`;
}

function makeClientText(payload: SubmissionEmailPayload, submissionId: string) {
  const pre = `Thanks, ${payload.name}! We’ve received "${payload.projectTitle}".`;
  const base = makeText(payload);
  return [
    pre,
    '',
    `Submission ID: ${submissionId}`,
    '',
    'What happens next:',
    '1) Scoping reply within 1–2 business days',
    '2) Proposal with timeline if it’s a fit',
    '3) Kickoff call',
    '',
    'Book a quick call: ' + (process.env.CLIENT_CTA_URL || 'https://example.com/book'),
    '',
    base,
  ].join('\n');
}

/* ---------------------------
   Main exported function
   --------------------------- */

export async function trySendSubmissionEmails(payload: SubmissionEmailPayload) {
  const result = { client: false, admin: false } as const;

  try {
    const transporter = getTransporter();
    const from = getFromAddress();
    const support = process.env.SUPPORT_EMAIL || process.env.REPLY_TO || undefined;

    // Support the env var name used in DEPLOYMENT.md/render.yaml, plus legacy names.
    const adminRaw =
      process.env.ADMIN_NOTIFICATION_EMAILS || process.env.NOTIFY_EMAIL || process.env.EMAIL_TO || '';
    const adminList = adminRaw
      .split(/[;,]/)
      .map(s => s.trim())
      .filter(Boolean);
    const adminTo = adminList.length > 0 ? adminList : undefined;
    const submissionId = makeSubmissionId();

    // Prepare optional inline images
    const attachments: Array<any> = [];
    const assets: { headerCid?: string; logoCid?: string } = {};
    const headerPath = process.env.EMAIL_HEADER_IMAGE_PATH;
    const headerUrl = process.env.EMAIL_HEADER_IMAGE_URL;
    if (headerPath) {
      assets.headerCid = 'brandHeader';
      attachments.push({ filename: 'header.png', path: headerPath, cid: assets.headerCid });
    }
    if (process.env.EMAIL_LOGO_PATH) {
      assets.logoCid = 'brandLogo';
      attachments.push({ filename: 'logo.png', path: process.env.EMAIL_LOGO_PATH, cid: assets.logoCid });
    }

    const htmlClient = makeClientHtml(payload, submissionId, { ...assets, headerUrl });
    const textClient = makeClientText(payload, submissionId);
    const subjectBase = `Project Catalyst: ${payload.projectTitle}`;
    const clientSubject = `Thanks — We received your project (${submissionId.slice(0, 8)})`;

    const headers = {
      'X-Submission-ID': submissionId,
      'List-ID': 'project-catalyst.submissions',
    };

    // Client email
    const clientInfo = await transporter.sendMail({
      from,
      to: payload.email,
      replyTo: support,
      subject: clientSubject,
      text: textClient,
      html: htmlClient,
      headers,
      attachments,
    });
    (result as any).client = true;
    console.info(`Email(client) messageId=${clientInfo.messageId} to=${payload.email}`);

    // Admin notification
    if (adminTo) {
      const htmlAdmin = makeHtml(payload, {
        headerCid: assets.headerCid,
        headerUrl,
        brandColor: process.env.BRAND_COLOR,
        brandName: process.env.EMAIL_FROM_NAME,
      });
      const textAdmin = makeText(payload);
      const adminInfo = await transporter.sendMail({
        from,
        to: adminTo,
        replyTo: payload.email,
        subject: `New submission — ${subjectBase} [${submissionId}]`,
        text: textAdmin,
        html: htmlAdmin,
        headers,
        attachments,
      });
      (result as any).admin = true;
      console.info(
        `Email(admin) messageId=${adminInfo.messageId} to=${Array.isArray(adminTo) ? adminTo.join(',') : adminTo}`
      );
    }

    return result;
  } catch (err) {
    const safeSmtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      userSet: Boolean(process.env.SMTP_USER),
      passSet: Boolean(process.env.SMTP_PASS),
    };
    console.warn(
      'Email send skipped/failed:',
      err instanceof Error ? err.stack || err.message : err,
      '\nSMTP config (safe):',
      safeSmtpConfig
    );
    return result;
  }
}
