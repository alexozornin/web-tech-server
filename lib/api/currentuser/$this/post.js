'use strict'

const userKeys = ['id', 'firstName', 'surname', 'email', 'level'];

module.exports = async (ctx, next, urlParts, query, db, koauth) => {
    try {
        let user = await koauth.getUser(ctx);
        if (user) {
            for (let key in user) {
                if (!userKeys.includes(key)) {
                    delete user[key];
                }
            }
        }
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true, data: {
                user
            }
        });
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
