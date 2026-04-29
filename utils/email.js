const nodemailer = require("nodemailer");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.url = url;
    this.firstName = user.name.split(" ")[0];
  }

  createTransport() {
    // 🔥 PRODUCTION (Gmail or SMTP)
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }

    // 🧪 DEVELOPMENT (Mailtrap)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(subject, message) {
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: this.to,
      subject,
      text: message,
    };
    await this.createTransport().sendMail(mailOptions);
  }

  async sendPasswordReset() {
    const message = `
Forgot your password?

Click the link below to reset it:

${this.url}

This link will expire in 10 minutes.
If you didn't request this, please ignore this email.
`;

    await this.newTransport().sendMail({
      from: this.from,
      to: this.to,
      subject: "Reset your password",
      text: message,
    });
  }
};
