const db = require('../config/database');

/**
 * Modèle Annonce - Gestion des annonces
 */
class Annonce {
    /**
     * Créer une nouvelle annonce
     * @param {Object} data - Données de l'annonce
     * @param {string} data.titre - Titre de l'annonce
     * @param {string} data.description - Description de l'annonce
     * @param {number} data.prix - Prix de l'annonce
     * @param {string} data.categorie - Catégorie de l'annonce
     * @param {number} data.user_id - ID de l'utilisateur créateur
     * @returns {Promise<number>} ID de la nouvelle annonce
     */
    static async create({ titre, description, prix, categorie, user_id }) {
        const [result] = await db.query(
            'INSERT INTO annonces (titre, description, prix, categorie, user_id, statut) VALUES (?, ?, ?, ?, ?, ?)',
            [titre, description, prix, categorie || null, user_id, 'visible']
        );
        return result.insertId;
    }

    /**
     * Récupérer toutes les annonces avec filtres
     * @param {Object} filters - Filtres de recherche
     * @param {string} filters.statut - Filtrer par statut (visible, non-visible)
     * @param {string} filters.categorie - Filtrer par catégorie
     * @param {string} filters.search - Rechercher dans titre/description
     * @param {number} filters.user_id - Filtrer par utilisateur
     * @returns {Promise<Array>} Liste des annonces
     */
    static async findAll(filters = {}) {
        let query = `
            SELECT
                a.*,
                u.nom as annonceur_nom,
                u.email as annonceur_email
            FROM annonces a
            JOIN users u ON a.user_id = u.id
        `;
        const params = [];
        const conditions = [];

        // Filtrer par statut
        if (filters.statut) {
            conditions.push('a.statut = ?');
            params.push(filters.statut);
        }

        // Filtrer par catégorie
        if (filters.categorie) {
            conditions.push('a.categorie = ?');
            params.push(filters.categorie);
        }

        // Recherche par mots-clés (titre ou description)
        if (filters.search) {
            conditions.push('(a.titre LIKE ? OR a.description LIKE ?)');
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        // Filtrer par utilisateur
        if (filters.user_id) {
            conditions.push('a.user_id = ?');
            params.push(filters.user_id);
        }

        // Ajouter les conditions WHERE si nécessaire
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Trier par date de création (plus récent en premier)
        query += ' ORDER BY a.created_at DESC';

        const [rows] = await db.query(query, params);
        return rows;
    }

    /**
     * Récupérer une annonce par ID
     * @param {number} id - ID de l'annonce
     * @returns {Promise<Object|null>} Annonce trouvée ou null
     */
    static async findById(id) {
        const [rows] = await db.query(
            `SELECT
                a.*,
                u.nom as annonceur_nom,
                u.email as annonceur_email,
                u.id as annonceur_id
            FROM annonces a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Récupérer toutes les annonces d'un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Array>} Liste des annonces de l'utilisateur
     */
    static async findByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM annonces WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }

    /**
     * Mettre à jour une annonce
     * @param {number} id - ID de l'annonce
     * @param {Object} data - Données à mettre à jour
     * @returns {Promise<number>} Nombre de lignes affectées
     */
    static async update(id, data) {
        const fields = [];
        const values = [];

        // Construire dynamiquement la requête UPDATE
        const allowedFields = ['titre', 'description', 'prix', 'categorie'];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });

        if (fields.length === 0) {
            throw new Error('Aucune donnée à mettre à jour');
        }

        values.push(id);

        const [result] = await db.query(
            `UPDATE annonces SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return result.affectedRows;
    }

    /**
     * Supprimer une annonce
     * @param {number} id - ID de l'annonce
     * @returns {Promise<number>} Nombre de lignes supprimées
     */
    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM annonces WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    /**
     * Mettre à jour le statut d'une annonce (admin)
     * @param {number} id - ID de l'annonce
     * @param {string} statut - Nouveau statut (visible, non-visible)
     * @param {string|null} commentaire_admin - Commentaire de l'administrateur
     * @returns {Promise<number>} Nombre de lignes affectées
     */
    static async updateStatut(id, statut, commentaire_admin = null) {
        const [result] = await db.query(
            'UPDATE annonces SET statut = ?, commentaire_admin = ? WHERE id = ?',
            [statut, commentaire_admin, id]
        );
        return result.affectedRows;
    }

    /**
     * Récupérer les catégories existantes
     * @returns {Promise<Array>} Liste des catégories uniques
     */
    static async getCategories() {
        const [rows] = await db.query(
            'SELECT DISTINCT categorie FROM annonces WHERE categorie IS NOT NULL ORDER BY categorie'
        );
        return rows.map(row => row.categorie);
    }

    /**
     * Compter le nombre d'annonces par statut
     * @returns {Promise<Object>} Statistiques des annonces
     */
    static async getStats() {
        const [rows] = await db.query(`
            SELECT
                statut,
                COUNT(*) as count
            FROM annonces
            GROUP BY statut
        `);

        const stats = {
            visible: 0,
            'non-visible': 0,
            total: 0
        };

        rows.forEach(row => {
            stats[row.statut] = row.count;
            stats.total += row.count;
        });

        return stats;
    }
}

module.exports = Annonce;