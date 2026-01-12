const { Model } = require ('sequelize');

const User = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(model) {
            this.hasMany(model.Annonce, {
                foreignKey: 'user_id',
                as: 'Annonces'
            })
        }

        clean() {
            const { password, token, updatedAt, createdAt, ...cleanedUser } = this.dataValues;
            return cleanedUser;
        }
    }

    User.init({
        firstname: DataTypes.STRING,
        lastname: DataTypes.STRING,
        profil_picture: DataTypes.STRING,
        phone_number: DataTypes.STRING,
        address: DataTypes.STRING,
        zip_code: DataTypes.STRING,
        city: DataTypes.STRING,
        token: DataTypes.TEXT,
        role: {
            type: DataTypes.STRING,
            defaultValue: 'seller',
            validate: {
                isIn: [['admin', 'seller']]
            }
        },
        username: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        password: DataTypes.STRING
    }, {
        modelName: 'User',
        sequelize
    })

    return User;
}

module.exports = User;