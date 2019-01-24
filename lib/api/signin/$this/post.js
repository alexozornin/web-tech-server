'use strict'

const config = require('../../../../config.json');

module.exports = async (ctx, next, urlParts, query, db, koauth) => {
    try {
        let user = await db.models['users'].findOne({
            where: {
                email: ctx.request.body.email
            }
        });
        if (!user) {
            ctx.status = 200;
            ctx.body = JSON.stringify({
                success: false,
                error: {
                    code: 0,
                    msg: 'User not found'
                }
            });
            return;
        }
        if (user.dataValues) {
            user = user.dataValues;
        }
        if (user.level > config.levels.user) {
            ctx.status = 200;
            ctx.body = JSON.stringify({
                success: false,
                error: {
                    code: 0,
                    msg: 'User is not allowed to sign in'
                }
            });
            return;
        }
        let auth = await koauth.signIn(ctx, db);
        if (!auth || !auth.user) {
            ctx.status = 200;
            ctx.body = JSON.stringify({
                success: false,
                error: {
                    code: 0,
                    msg: 'Wrong credentials'
                }
            });
            return;
        }
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK',
            data: {
                id: user.id
            }
        });
        return;
    }
    catch (err) {
        ctx.status = 200;
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
