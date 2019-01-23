'use strict'

const config = require('../../../../config.json');
const path = require('path');
const afs = require('alex-async-fs');
const ah = require('alex-hash');

module.exports = async (ctx, next, urlParts, query, db, koauth) => {
    try {
        if (!query.user || !query.token) {

        }
        let user = await db.models['users'].findOne({
            where: {
                id: query.user,
                session: query.token
            }
        });
        if (!user) {
            ctx.body = await afs.readFileAsync(path.join(__dirname, '..', '..', '..', 'pages', 'error.html'), { encoding: 'utf8' });
            return;
        }
        if (user.dataValues) {
            user = user.dataValues;
        }
        await db.models['users'].update({ level: config.levels.user }, {
            where: {
                id: user.id
            }
        });
        ctx.body = await afs.readFileAsync(path.join(__dirname, '..', '..', '..', 'pages', 'success.html'), { encoding: 'utf8' });
        return;
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Internal server error'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}