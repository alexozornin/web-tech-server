'use strict'

module.exports = (sequelize, DataTypes) =>
{
    return sequelize.define('users', {
        email: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: true
        },
        password: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: false
        },
        salt: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: false
        },
        level: {
            allowNull: false,
            type: DataTypes.INTEGER,
            unique: false
        },
        session: {
            allowNull: true,
            type: DataTypes.STRING,
            unique: false
        },
        name: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: false
        },
        phone: {
            allowNull: false,
            type: DataTypes.STRING,
            unique: false
        },
    });
}
