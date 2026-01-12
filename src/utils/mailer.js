const { createTransport } = require('nodemailer');
require('dotenv').config({ quiet: true });

const transporter = createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
});

const mailer = async (to, subject, text, html) => {
    try{
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch(error) {
        return error;
    }
}

module.exports = {
    mailer
}