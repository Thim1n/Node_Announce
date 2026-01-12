process.env.JWT_SECRET = 'test_secret_key_for_jwt_tokens';
process.env.DB_NAME = 'test_db';
process.env.NODE_ENV = 'test';

jest.mock('../src/utils/mailer', () => ({

    mailer: jest.fn().mockResolvedValue(true)

}));

const { dbInstance } = require('../src/models');

beforeAll(async () => {
    // Synchroniser la base de données avant tous les tests
    await dbInstance.sync({ force: true });
});

afterAll(async () => {
    // Fermer la connexion après tous les tests
    await dbInstance.close();
});
