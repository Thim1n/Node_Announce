const request = require('supertest');
const app = require('../../src/apps');

describe("POST /register", () => {
    test("Retourne un code 201 lors de la création d'un utilisateur avec des données valides", async () => {
        const result = await request(app)
            .post("/register")
            .send({
                firstname: "John",
                lastname: "Doe",
                username: `user${Date.now() % 1000000}`,
                password: "Password123",
                phone_number: "0123456789",
                address: "123 Test Street",
                zip_code: "75001",
                city: "Paris"
            })
            .expect(201);

        expect(result.body).toHaveProperty('success', true);
        expect(result.body).toHaveProperty('message');
        expect(result.body).toHaveProperty('data');
        expect(result.body.data).toHaveProperty('user');
        expect(result.body.data.user).toHaveProperty('username');
    });

    test("Retourne un code erreur 400 si les données sont invalides ou manquantes", async () => {
        await request(app)
            .post("/register")
            .send({
                username: "testuser"
                // Données incomplètes
            })
            .expect(400);
    });
});



describe("POST /login", () => {
    const testUsername = "loginuser";
    const testPassword = "Password123";

    // Créer un utilisateur
    beforeAll(async () => {
        const registerResult = await request(app)
            .post("/register")
            .send({
                firstname: "Global",
                lastname: "TestUser",
                username: testUsername,
                password: testPassword,
                phone_number: "0123456789",
                address: "123 Test Street",
                zip_code: "75001",
                city: "Paris"
            });
    });

    test("Retourne un code 401 si l'utilisateur n'existe pas", async () => {
        await request(app)
            .post("/login")
            .send({
                username: "nonexistentuser",
                password: "password123"
            })
            .expect(401);
    });

    test("Retourne un code 401 si le mot de passe est incorrect", async () => {
        await request(app)
            .post("/login")
            .send({
                username: testUsername,
                password: "wrongpassword"
            })
            .expect(401);
    });

    test("Retourne un code 200 et un token si les identifiants sont corrects", async () => {
        const result = await request(app)
            .post("/login")
            .send({
                username: testUsername,
                password: testPassword
            })
            .expect(200);

        expect(result.body).toHaveProperty('success', true);
        expect(result.body).toHaveProperty('message');
        expect(result.body).toHaveProperty('data');
        expect(result.body.data).toHaveProperty('token');
        expect(result.body.data).toHaveProperty('user');
    });
});

describe("POST /logout", () => {
    test("Retourne un code 401 si aucun token n'est fourni", async () => {
        await request(app)
            .post("/logout")
            .expect(401);
    });

    test("Retourne un code 200 si le logout réussit avec un token valide", async () => {
        const username = `user${Date.now() % 1000000}`;
        const password = "Password123";

        const registerResult = await request(app)
            .post("/register")
            .send({
                firstname: "Bob",
                lastname: "Johnson",
                username: username,
                password: password,
                phone_number: "0123456789",
                address: "123 Test Street",
                zip_code: "75001",
                city: "Paris"
            });

        if (registerResult.status !== 201) {
            console.error('Échec de l\'inscription:', registerResult.body);
            throw new Error('Impossible de créer l\'utilisateur de test');
        }

        const loginResult = await request(app)
            .post("/login")
            .send({
                username: username,
                password: password
            });

        if (loginResult.status !== 200) {
            console.error('Échec de la connexion:', loginResult.body);
            throw new Error('Impossible de se connecter avec l\'utilisateur de test');
        }

        const token = loginResult.body.data.token;

        const result = await request(app)
            .post("/logout")
            .set('Authorization', token)
            .expect(200);

        expect(result.body).toHaveProperty('success', true);
        expect(result.body).toHaveProperty('message');
        expect(result.body.message).toBe('Déconnexion réussie');
    });
});