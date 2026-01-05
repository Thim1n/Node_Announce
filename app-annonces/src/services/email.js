const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Configuration du transporteur email (SMTP)
 */
const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number.parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true pour le port 465, false pour les autres ports
};

// Pour MailHog (développement), pas besoin d'authentification
// Pour autres serveurs SMTP, ajouter l'authentification
if (process.env.EMAIL_HOST !== 'mailhog' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    emailConfig.auth = {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    };
}

const transporter = nodemailer.createTransport(emailConfig);

/**
 * Vérifier la connexion au serveur SMTP
 */
const verifyEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Service email configuré et prêt');
        return true;
    } catch (error) {
        console.error('❌ Erreur de configuration email:', error.message);
        console.error('Vérifiez vos variables d\'environnement EMAIL_*');
        return false;
    }
};

/**
 * Envoyer un email de signalement à l'administrateur
 * @param {Object} params - Paramètres du signalement
 * @param {string} params.userEmail - Email de l'utilisateur qui signale
 * @param {string} params.message - Message du signalement
 * @param {number} params.annonceId - ID de l'annonce concernée
 * @param {string} params.annonceTitle - Titre de l'annonce
 * @returns {Promise<Object>} Résultat de l'envoi
 */
const sendSignalementEmail = async ({ userEmail, message, annonceId, annonceTitle }) => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

        const mailOptions = {
            from: `"Plateforme Annonces" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `🚨 Signalement - Annonce #${annonceId}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                        }
                        .header {
                            background-color: #d32f2f;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 5px 5px 0 0;
                        }
                        .content {
                            background-color: white;
                            padding: 20px;
                            border-radius: 0 0 5px 5px;
                        }
                        .info-row {
                            margin: 10px 0;
                            padding: 10px;
                            background-color: #f5f5f5;
                            border-left: 4px solid #d32f2f;
                        }
                        .info-label {
                            font-weight: bold;
                            color: #d32f2f;
                        }
                        .message-box {
                            margin: 20px 0;
                            padding: 15px;
                            background-color: #fff3e0;
                            border-radius: 5px;
                            border: 1px solid #ffb74d;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🚨 Nouveau Signalement</h2>
                        </div>
                        <div class="content">
                            <p>Un utilisateur a signalé un problème concernant une annonce.</p>

                            <div class="info-row">
                                <span class="info-label">De:</span> ${userEmail}
                            </div>

                            <div class="info-row">
                                <span class="info-label">Annonce concernée:</span> #${annonceId} - "${annonceTitle}"
                            </div>

                            <div class="message-box">
                                <p class="info-label">Message:</p>
                                <p>${message}</p>
                            </div>

                            <p style="margin-top: 20px;">
                                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/annonces/${annonceId}"
                                   style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                    Voir l'annonce
                                </a>
                            </p>

                            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

                            <p style="font-size: 12px; color: #999;">
                                Cet email a été envoyé automatiquement par la plateforme d'annonces.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('📧 Email de signalement envoyé:', info.messageId);

        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error('❌ Erreur envoi email signalement:', error);
        throw new Error(`Impossible d'envoyer l'email: ${error.message}`);
    }
};

/**
 * Envoyer un email de bienvenue à un nouvel utilisateur
 * @param {Object} params - Paramètres de l'email
 * @param {string} params.email - Email du destinataire
 * @param {string} params.nom - Nom de l'utilisateur
 * @returns {Promise<Object>} Résultat de l'envoi
 */
const sendWelcomeEmail = async ({ email, nom }) => {
    try {
        const mailOptions = {
            from: `"Plateforme Annonces" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🎉 Bienvenue sur la plateforme d\'annonces',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🎉 Bienvenue ${nom} !</h2>
                        </div>
                        <div class="content">
                            <p>Merci de vous être inscrit sur notre plateforme d'annonces.</p>
                            <p>Vous pouvez maintenant :</p>
                            <ul>
                                <li>Publier vos annonces</li>
                                <li>Consulter les annonces disponibles</li>
                                <li>Gérer votre profil</li>
                            </ul>
                            <p>À bientôt sur la plateforme !</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('📧 Email de bienvenue envoyé:', info.messageId);

        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error('❌ Erreur envoi email bienvenue:', error);
        // Ne pas bloquer l'inscription si l'email échoue
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Envoyer une notification à l'annonceur quand le statut de son annonce change
 * @param {Object} params - Paramètres de l'email
 * @param {string} params.email - Email de l'annonceur
 * @param {string} params.nom - Nom de l'annonceur
 * @param {string} params.annonceTitle - Titre de l'annonce
 * @param {number} params.annonceId - ID de l'annonce
 * @param {string} params.statut - Nouveau statut
 * @param {string} params.commentaire - Commentaire de l'admin
 * @returns {Promise<Object>} Résultat de l'envoi
 */
const sendStatutChangeEmail = async ({ email, nom, annonceTitle, annonceId, statut, commentaire }) => {
    try {
        const isVisible = statut === 'visible';
        const statusColor = isVisible ? '#4caf50' : '#f44336';
        const statusText = isVisible ? 'VALIDÉE' : 'MASQUÉE';

        const mailOptions = {
            from: `"Plateforme Annonces" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `${isVisible ? '✅' : '⚠️'} Statut de votre annonce modifié`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                        .content { background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
                        .status { font-weight: bold; color: ${statusColor}; font-size: 18px; }
                        .comment-box { background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Modification du statut de votre annonce</h2>
                        </div>
                        <div class="content">
                            <p>Bonjour ${nom},</p>
                            <p>Le statut de votre annonce <strong>"${annonceTitle}"</strong> (ID: #${annonceId}) a été modifié.</p>
                            <p class="status">Nouveau statut: ${statusText}</p>
                            ${commentaire ? `
                                <div class="comment-box">
                                    <p><strong>Commentaire de l'administrateur:</strong></p>
                                    <p>${commentaire}</p>
                                </div>
                            ` : ''}
                            <p>${isVisible ? 'Votre annonce est maintenant visible par tous les utilisateurs.' : 'Votre annonce n\'est plus visible publiquement.'}</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('📧 Email de notification envoyé:', info.messageId);

        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error('❌ Erreur envoi email notification:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Vérifier la connexion au démarrage
verifyEmailConnection();

module.exports = {
    sendSignalementEmail,
    sendWelcomeEmail,
    sendStatutChangeEmail,
    verifyEmailConnection
};