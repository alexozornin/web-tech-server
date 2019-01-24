'use strict'

module.exports = async (ctx, next, urlParts, query, db, koauth) => {
    try {
        await koauth.signOut(ctx);
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK'
        });
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
