const { Model } = require('sequelize');

const Category = (sequelize, DataTypes) => {
    class Category extends Model {
        static associate(models) {
            this.hasMany(models.Annonce, {
                foreignKey: 'category_id',
                as: 'Annonces'
            });
        }
    }

    Category.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        modelName: 'Category',
        sequelize
    });

    return Category;
};

module.exports = Category;
