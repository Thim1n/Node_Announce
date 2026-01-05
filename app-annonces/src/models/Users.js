const db = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Modèle User - Gestion des utilisateurs
 */
class User {
    /**
     * Créer un nouvel utilisateur
     * @param {Object} userData - Données de l'utilisateur
     * @param {string} userData.nom - Nom de l'utilisateur
     * @param {string} userData.email - Email de l'utilisateur
     * @param {string} userData.password - Mot de passe en clair
     * @param {string} userData.role - Rôle (annonceur, administrateur, acheteur)
     * @returns {Promise<number>} ID du nouvel utilisateur
     */
    static async create({ nom, email, password, role = 'annonceur' }) {
        try {
            // Hasher le mot de passe
            const hashedPassword = await bcrypt.hash(password, 10);

            const [result] = await db.query(
                'INSERT INTO users (nom, email, password, role) VALUES (?, ?, ?, ?)',
                [nom, email, hashedPassword, role]
            );

            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Cet email est déjà utilisé');
            }
            throw error;
        }
    }

    /**
     * Trouver un utilisateur par email
     * @param {string} email - Email de l'utilisateur
     * @returns {Promise<Object|null>} Utilisateur trouvé ou null
     */
    static async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0] || null;
    }

    /**
     * Trouver un utilisateur par ID
     * @param {number} id - ID de l'utilisateur
     * @returns {Promise<Object|null>} Utilisateur trouvé ou null
     */
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT id, nom, email, role, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Récupérer tous les utilisateurs
     * @param {Object} filters - Filtres optionnels
     * @param {string} filters.role - Filtrer par rôle
     * @returns {Promise<Array>} Liste des utilisateurs
     */
    static async findAll(filters = {}) {
        let query = 'SELECT id, nom, email, role, created_at FROM users';
        const params = [];

        if (filters.role) {
            query += ' WHERE role = ?';
            params.push(filters.role);
        }

        query += ' ORDER BY created_at DESC';

        const [rows] = await db.query(query, params);
        return rows;
    }

    /**
     * Mettre à jour un utilisateur
     * @param {number} id - ID de l'utilisateur
     * @param {Object} data - Données à mettre à jour
     * @returns {Promise<number>} Nombre de lignes affectées
     */
    static async update(id, data) {
        const fields = [];
        const values = [];

        // Construire dynamiquement la requête UPDATE
        if (data.nom !== undefined) {
            fields.push('nom = ?');
            values.push(data.nom);
        }

        if (data.email !== undefined) {
            fields.push('email = ?');
            values.push(data.email);
        }

        if (data.password !== undefined) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            fields.push('password = ?');
            values.push(hashedPassword);
        }

        if (fields.length === 0) {
            throw new Error('Aucune donnée à mettre à jour');
        }

        values.push(id);

        const [result] = await db.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows;
    }

    /**
     * Supprimer un utilisateur
     * @param {number} id - ID de l'utilisateur
     * @returns {Promise<number>} Nombre de lignes supprimées
     */
    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM users WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    /**
     * Comparer un mot de passe avec son hash
     * @param {string} plainPassword - Mot de passe en clair
     * @param {string} hashedPassword - Mot de passe hashé
     * @returns {Promise<boolean>} True si correspond, false sinon
     */
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Vérifier si un email existe déjà
     * @param {string} email - Email à vérifier
     * @returns {Promise<boolean>} True si existe, false sinon
     */
    static async emailExists(email) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM users WHERE email = ?',
            [email]
        );
        return rows[0].count > 0;
    }
}

module.exports = User;