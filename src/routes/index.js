const annoncesRoutes = require('./announces');
const authRoutes = require('./auth');
const usersRoutes = require('./users');
const categoriesRoutes = require('./categories');

const initRoutes = (app) => {
    app.use('/', authRoutes);
    app.get('/', (req, res) => {
        res.status(200).json({
            success: true,
            message: 'API Annonces en ligne',
            version: '1.0.0',
            endpoints: {
                auth: '/register, /login, /logout',
                annonces: '/annonces',
                users: '/users',
                categories: '/categories'
            }
        });
    });
    app.use('/annonces', annoncesRoutes);
    app.use('/users', usersRoutes);
    app.use('/categories', categoriesRoutes);
}

module.exports = initRoutes;