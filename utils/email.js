const nodemailer = require("nodemailer");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.url = url;
    this.firstName = user.name.split(" ")[0];
  }

  createTransport() {
    // return nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     password: process.env.EMAIL_PASSWORD,
    //     user: process.env.EMAIL_USERNAME,
    //   },
    // });

    // return nodemailer.createTransport({
    //   host: "sandbox.smtp.mailtrap.io",
    //   port: 2525,
    //   auth: {
    //     password: process.env.EMAIL_PASSWORD,
    //     user: process.env.EMAIL_USERNAME,
    //   },
    // });

    return nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "bf798c9cd23cfc",
        pass: "cf6d474aa3a263",
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
