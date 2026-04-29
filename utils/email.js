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
    await this.send(
      "Your password reset token (valid for 10 minutes)",
      `Forgot your password? Submit a PATCH request with your new password and 
      passwordConfirm to: ${this.url}.\nIf you didn't forget your password, please ignore this email!`,
    );
  }
};
