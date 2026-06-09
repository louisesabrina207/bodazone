const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    // support both SMTP_PASS and SMTP_PASSWORD env names for compatibility
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass
        }
      });
      this.from = process.env.SMTP_FROM || user;
    } else {
      this.transporter = null;
      this.from = process.env.SMTP_FROM || 'no-reply@bodazone.local';
    }
  }

  async sendMail({ to, subject, text, html }) {
    if (!this.transporter) {
      console.log('[emailService] SMTP not configured. Skipping email send:', { to, subject, text });
      return { skipped: true };
    }

    return this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      text,
      html
    });
  }
}

module.exports = new EmailService();