const request = require('supertest');
const app = require('../../src/apps');

// Variables globales pour l'authentification
let authToken;
let testUserId;
const testUsername = `user${Date.now() % 1000000}`;
const testPassword = 'Password123';

// Créer un utilisateur et obtenir un token avant tous les tests
beforeAll(async () => {
    // Créer un utilisateur de test
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

    // Vérifier que l'inscription a réussi
    if (registerResult.status !== 201) {
        console.error('Échec de l\'inscription:', registerResult.body);
        throw new Error('Impossible de créer l\'utilisateur de test');
    }

    // Se connecter pour obtenir le token
    const loginResult = await request(app)
        .post("/login")
        .send({
            username: testUsername,
            password: testPassword
        });

    // Vérifier que la connexion a réussi
    if (loginResult.status !== 200) {
        console.error('Échec de la connexion:', loginResult.body);
        throw new Error('Impossible de se connecter avec l\'utilisateur de test');
    }

    authToken = loginResult.body.data.token;
    testUserId = loginResult.body.data.user.id;
});

describe("GET /annonces", () => {
    test("Retourne un code 200 et une liste d'annonces", async () => {
        const result = await request(app)
            .get("/annonces")
            .expect(200);

        expect(result.body).toHaveProperty('success', true);
        expect(result.body).toHaveProperty('data');
        expect(result.body.data).toHaveProperty('annonces');
        expect(Array.isArray(result.body.data.annonces)).toBe(true);
    });

    test("Retourne un code 200 avec un paramètre de recherche", async () => {
        const result = await request(app)
            .get("/annonces")
            .query({ search: "test" })
            .expect(200);

        expect(result.body).toHaveProperty('success', true);
        expect(result.body).toHaveProperty('data');
        expect(result.body.data).toHaveProperty('annonces');
        expect(Array.isArray(result.body.data.annonces)).toBe(true);
    });
});

describe("GET /annonces/:id", () => {
    let testAnnonceId;

    beforeEach(async () => {
        // Créer une annonce avant les tests
        const response = await request(app)
            .post("/annonces")
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: "Annonce Test GET",
                description: "Description test",
                price: 100,
                status: "published"
            });
        testAnnonceId = response.body.data.annonce.id;
    });

    test("Retourne un code 200 et une annonce pour un ID existant", async () => {
        const result = await request(app)
            .get(`/annonces/${testAnnonceId}`)
            .expect(200);

        expect(result.body).toHaveProperty('success', true);
        expect(result.body).toHaveProperty('data');
        expect(result.body.data).toHaveProperty('annonce');
        expect(result.body.data.annonce).toHaveProperty('id', testAnnonceId);
        expect(result.body.data.annonce).toHaveProperty('title', "Annonce Test GET");
    });

    test("Retourne un code 404 pour un ID inexistant", async () => {
        await request(app)
            .get("/annonces/99999")
            .expect(404);
    });
});

describe("POST /annonces", () => {
    test("Retourne un code 401 si aucune authentification n'est fournie", async () => {
        await request(app)
            .post("/annonces")
            .send({
                title: "Test Annonce",
                description: "Description de test",
                price: 100,
                status: "published"
            })
            .expect(401);
    });

    test("Retourne un code 201 lors de la création d'une annonce avec authentification valide", async () => {
        // Créer une annonce
        const result = await request(app)
            .post("/annonces")
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: "Annonce Test",
                description: "Ceci est une annonce de test",
                price: 150,
                status: "published"
            })
            .expect(201);

        expect(result.body).toHaveProperty('success', true);
        expect(result.body).toHaveProperty('message');
        expect(result.body).toHaveProperty('data');
        expect(result.body.data).toHaveProperty('annonce');
    });

    test("Retourne un code 400 si les données de l'annonce sont invalides", async () => {
      await request(app)
            .post("/annonces")
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                // Données incomplètes ou invalides
                title: ""
            })
            .expect(400);
    });
});

describe("PUT /annonces/:id", () => {
    let testAnnonceId;

    beforeEach(async () => {
        // Créer une annonce avant chaque test
        const response = await request(app)
            .post("/annonces")
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: "Annonce Test PUT",
                description: "Description test",
                price: 150,
                status: "published"
            });
        testAnnonceId = response.body.data.annonce.id;
    });

    test("Retourne un code 401 si aucune authentification n'est fournie", async () => {
        await request(app)
            .put(`/annonces/${testAnnonceId}`)
            .send({
                title: "Annonce Mise à Jour",
                description: "Description mise à jour",
                price: 200,
                status: "published"
            })
            .expect(401);
    });

    test("Retourne un code 200 lors de la mise à jour d'une annonce avec authentification", async () => {
        const result = await request(app)
            .put(`/annonces/${testAnnonceId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: "Annonce Mise à Jour",
                description: "Description mise à jour",
                price: 200,
                status: "published"
            })
            .expect(200);

        expect(result.body).toHaveProperty('success', true);
        expect(result.body).toHaveProperty('message');
        expect(result.body).toHaveProperty('data');
    });

    test("Retourne un code 400 si les données de mise à jour sont invalides", async () => {
        await request(app)
            .put(`/annonces/${testAnnonceId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                price: "d"
            })
            .expect(400);
    });

    test("Retourne un code 404 si l'annonce n'existe pas", async () => {
        await request(app)
            .put("/annonces/99999")
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: "Mise à jour impossible",
                price: 200
            })
            .expect(404);
    });
});

describe("DELETE /annonces/:id", () => {
    let testAnnonceId;

    beforeEach(async () => {
        // Créer une annonce avant chaque test
        const response = await request(app)
            .post("/annonces")
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                title: "Annonce Test DELETE",
                description: "Description test",
                price: 150,
                status: "published"
            });
        testAnnonceId = response.body.data.annonce.id;
    });

    test("Retourne un code 401 si aucune authentification n'est fournie", async () => {
        await request(app)
            .delete(`/annonces/${testAnnonceId}`)
            .expect(401);
    });

    test("Retourne un code 200 lors de la suppression d'une annonce avec authentification", async () => {
        const result = await request(app)
            .delete(`/annonces/${testAnnonceId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(result.body).toHaveProperty('success', true);
        expect(result.body).toHaveProperty('message');
        expect(result.body.message).toBe("Annonce supprimée avec succès");
    });

    test("Retourne un code 404 pour la suppression d'un ID inexistant", async () => {
        await request(app)
            .delete("/annonces/99999")
            .set('Authorization', `Bearer ${authToken}`)
            .expect(404);
    });
});

describe("GET /annonces/all", () => {
    test("Retourne un code 401 si aucune authentification n'est fournie", async () => {
        await request(app)
            .get("/annonces/all")
            .expect(401);
    });

    test("Retourne un code 403 si l'utilisateur n'est pas admin", async () => {
        // Essayer d'accéder à la route admin
        await request(app)
            .get("/annonces/all")
            .set('Authorization', `Bearer ${authToken}`)
            .expect(403);
    });
});