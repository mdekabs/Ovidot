import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Service for handling notification-related operations.
 */
class NotificationService {
  /**
   * Creates an instance of NotificationService.
   */
  constructor() {
    const emailService = process.env.APP_SERVICE;
    const emailAddress = process.env.APP_EMAIL;
    const emailPassword = process.env.APP_PASSWORD;

    /**
     * Nodemailer transporter for sending emails.
     * @type {nodemailer.Transporter}
     */
    this.transporter = nodemailer.createTransport({
      host: "smtp.ionos.com",
      port: 587,
      secure: false,
      service: emailService,
      auth: {
        user: emailAddress,
        pass: emailPassword,
      },
    });
  }

  /**
   * Sends a welcome notification email to the specified email address.
   * @param {string} email - The email address to send the notification to.
   * @param {string} name - The name of the recipient.
   * @returns {Promise<void>} - A promise that resolves when the email is sent successfully.
   */
  async sendWelcomeNotification(email, name) {
    const mailOptions = {
      from: process.env.APP_EMAIL,
      to: email,
      subject: "Welcome to Mdcator - Your Gateway to Secure Services 🚀",
      html: `
        <p>🎉 Hello ${name},</p>
        <p>Congratulations on joining Mdcator – where security meets seamless access! We're delighted to welcome you to our exclusive community of empowered users.</p>
        <p>Your security is our top priority, without sacrificing user experience. Our state-of-the-art authentication system ensures effortless access to secure services, all while keeping your data safe and sound.</p>
        <p>🔓 Ready to unlock endless possibilities? Let's dive in together! Click below to embark on your journey and discover a world of secure services.</p>
        <a href="http://16.171.242.67:5000/api-docs" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Get Started</a>
        <p>If you have any questions or need assistance, feel free to reach out at md@mdstorms.cloud.</p>
        <p>Welcome aboard – let's secure the future together!</p>
        <p>Warm regards,<br/>The Mdcator Team</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log("Welcome notification sent successfully");
    } catch (error) {
      console.error("Failed to send welcome notification:", error);
    }
  }
}

export default NotificationService;
