const { checkSchema } = require('express-validator');

const validateAnnonce = async (req, res, next) => {
    const [ validation ] = await checkSchema({
        title: { notEmpty: true }
    }).run(req);
    console.log('validation :', validation.isEmpty())
    if(!validation.isEmpty()) {
        res.status(400).json({
            message: 'le champs title est manquant'
        });
    }
    console.log('annonce validated');
    next();
}

// autre fonction de validation

module.exports = {
    validateAnnonce
};