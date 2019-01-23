'use strict'

const config = require('../../config.json');
const afs = require('alex-async-fs');
const path = require('path');
const Sequelize = require('sequelize');

class Database {
    constructor() {
        this.sequelize = new Sequelize(config.database.name, config.database.username, config.database.password, config.database.options);
    }

    async init() {
        let models = await afs.readDirAsync(path.join(__dirname, 'models'));
        for (let i in models) {
            this.sequelize.import(path.join(__dirname, 'models', models[i]));
        }
        await this.sequelize.sync({ force: false });
        this.models = this.sequelize.models;
    }
}

module.exports = Database;
