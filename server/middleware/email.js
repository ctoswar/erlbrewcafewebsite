// ─── Email Notification Middleware ─────────────────────────────────────────
// Sends email notifications for new event inquiries.
// Requires SMTP config in environment variables.
// ────────────────────────────────────────────────────────────────────────────

const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize the email transporter with SMTP config.
 * Returns null if SMTP is not configured (graceful degradation).
 */
function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[Email] SMTP not configured — email notifications disabled');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: parseInt(SMTP_PORT || '587', 10) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send notification email for a new event inquiry.
 * @param {Object} inquiry - The inquiry data
 * @param {string} inquiry.name - Customer name
 * @param {string} inquiry.email - Customer email
 * @param {string} inquiry.event_type - Type of event
 * @param {string} inquiry.event_date - Event date
 * @param {string} inquiry.message - Customer message
 */
async function sendInquiryNotification(inquiry) {
  const transport = getTransporter();
  if (!transport) return; // SMTP not configured, skip silently

  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (!notificationEmail) {
    console.warn('[Email] NOTIFICATION_EMAIL not set — skipping notification');
    return;
  }

  const subject = `New Event Inquiry from ${inquiry.name}`;

  const htmlBody = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #181714; color: #F4EFE6; padding: 24px; border-radius: 4px 4px 0 0;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 500;">New Event Inquiry</h2>
        <p style="margin: 8px 0 0; font-size: 12px; color: rgba(244,239,230,0.5);">Erlbrew Café</p>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid rgba(24,23,20,0.08); border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-size: 12px; color: rgba(24,23,20,0.4); width: 100px;">Name</td>
            <td style="padding: 8px 0; font-size: 14px; color: #181714;">${escapeHtml(inquiry.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 12px; color: rgba(24,23,20,0.4);">Email</td>
            <td style="padding: 8px 0; font-size: 14px; color: #181714;">${escapeHtml(inquiry.email)}</td>
          </tr>
          ${inquiry.event_type ? `
          <tr>
            <td style="padding: 8px 0; font-size: 12px; color: rgba(24,23,20,0.4);">Event Type</td>
            <td style="padding: 8px 0; font-size: 14px; color: #181714;">${escapeHtml(inquiry.event_type)}</td>
          </tr>` : ''}
          ${inquiry.event_date ? `
          <tr>
            <td style="padding: 8px 0; font-size: 12px; color: rgba(24,23,20,0.4);">Event Date</td>
            <td style="padding: 8px 0; font-size: 14px; color: #181714;">${escapeHtml(inquiry.event_date)}</td>
          </tr>` : ''}
        </table>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(24,23,20,0.08);">
          <p style="margin: 0 0 8px; font-size: 12px; color: rgba(24,23,20,0.4);">Message</p>
          <p style="margin: 0; font-size: 14px; color: #181714; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(inquiry.message)}</p>
        </div>
      </div>
      <div style="padding: 16px 24px; background: #F4EFE6; border-radius: 0 0 4px 4px; font-size: 11px; color: rgba(24,23,20,0.35);">
        Reply directly to ${escapeHtml(inquiry.email)} to respond to this inquiry.
      </div>
    </div>
  `;

  try {
    await transport.sendMail({
      from: process.env.SMTP_USER,
      to: notificationEmail,
      subject,
      html: htmlBody,
      replyTo: inquiry.email,
    });
    console.log(`[Email] Notification sent for inquiry from ${inquiry.name}`);
  } catch (err) {
    console.error('[Email] Failed to send notification:', err.message);
    // Don't throw — email failure shouldn't break the inquiry submission
  }
}

/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { sendInquiryNotification };
