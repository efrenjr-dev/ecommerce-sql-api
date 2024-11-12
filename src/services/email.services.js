const nodemailer = require("nodemailer");
const logger = require("../config/logger");
const config = require("../config/config");

// Looking to send emails in production? Check out our Email API/SMTP product!
const transportSMTP = nodemailer.createTransport(config.email.smtp);

transportSMTP
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch(() =>
        logger.warn(
            "Unable to connect to email server. Make sure you have configured the SMTP options in .env"
        )
    );

const sendEmail = async (to, subject, text) => {
    const msg = { from: config.email.from, to, subject, text };
    await transportSMTP.sendMail(msg);
};

/**
 *
 * @param {string} to
 * @param {string} name
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, name, token) => {
    const subject = "Email Verification Link";
    const link = `${config.email.url}/verify-email/${token}`;
    const text = `Dear ${name},
    To verify your email, please visit the link ${link}
    Link expires in ${config.jwt.emailExpirationMinutes} minutes.`;
    await sendEmail(to, subject, text);
};

const sendResetPasswordEmail = async (to, token) => {
    const subject = "Reset Password";
    const link = `${config.email.url}/reset-password/${token}`;
    const text = `Dear,
    To reset password for user ${to}, please visit the link ${link}
    Link expires in ${config.jwt.resetPasswordExpirationMinutes} minutes.`;
    await sendEmail(to, subject, text);
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
