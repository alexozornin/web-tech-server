'use strict'

const hh = require('../../../modules/hh.js');

const vacancies = [];

process.nextTick(async () => {
    await hh(vacancies);
});

module.exports = async (ctx, next, urlParts, query, db, koauth) => {
    try {
        console.log('hh');
        let res = [];
        for (let i = 0; i < vacancies.length; i++) {
            if(ctx.req.body.num && res.length >= ctx.req.body.num) {
                break;
            }
            if (!ctx.request.body.min || vacancies[i].salary >= ctx.request.body.min) {
                res.push(vacancies[i]);
            }
            if (!ctx.request.body.max || vacancies[i].salary <= ctx.request.body.max) {
                res.push(vacancies[i]);
            }
        }
        await koauth.signOut(ctx);
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK',
            data: res
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
