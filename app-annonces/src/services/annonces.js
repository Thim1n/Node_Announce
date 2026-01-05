module.exports = {
    getAllAnnonces,
    getAnnonce
};

function getAllAnnonces(req, res) {
    res.status(200).json({
        message: 'Mes annonces'
    });
}

function getAnnonce(req, res) {
    // req.params.id
    console.log('id :', req.params.id);
    res.status(200).json({
        message: 'Mon annonce',
        id: req.params.id
    });
}