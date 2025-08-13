const nodemailer = require('nodemailer');
const getTemplate = require('../services/templateManager');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 20000, // 20 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 20000,    // 20 seconds
    //  debug: true,
    //  logger: true
});




const sendEmail = async (to, subject, templateName, ...templateParams) => {
    try {
        const html = getTemplate(templateName, ...templateParams);
        const mailOptions = {
            from: process.env.SMTP_FROM, // sender address
            to,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);

        console.log(`${templateName} email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending ${templateName} email:`, error.message);  // Log specific error message
        throw new Error(`Failed to send ${templateName} email`);
    }
};






module.exports = sendEmail;

