// Import all templates
const emailVerificationTemplate = require('../templates/emailVerificationTemplate');
const notificationMailTemplate = require('../templates/notificationMailTemplate');
const bookingTemplate = require('../templates/bookingConfirmationTemplate');
// const completeRegistrationTemplate = require('../templates/completeRegistrationTemplate');
// const newsletterTemplate = require('../templates/newsletterTemplate');
// const contactTemplate = require('../templates/contactTemplate');



const templates = {
    verification: emailVerificationTemplate,
    notification: notificationMailTemplate,
    booking: bookingTemplate
    // resetPassword: resetPasswordTemplate,
    // completeRegistration: completeRegistrationTemplate,
    // newsletter: newsletterTemplate,
    // contact: contactTemplate,

};

const getTemplate = (templateName, ...params) => {
    const template = templates[templateName];
    if (!template) throw new Error(`Template "${templateName}" not found.`);
    return template(...params);
};

module.exports = getTemplate;
