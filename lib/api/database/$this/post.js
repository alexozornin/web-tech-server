'use strict'

let patternActions = require('./pattern.js');
let uniqueActions = require('./unique.js');

module.exports = async (ctx, next, urlParts, query, db, koauth) => {
    if (!ctx.request.body.model || !ctx.request.body.action) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'No model or action in body'
            }
        });
        return;
    }
    try {
        if (uniqueActions[ctx.request.body.model] && uniqueActions[ctx.request.body.model][ctx.request.body.action]) {
            await uniqueActions[ctx.request.body.model][ctx.request.body.action](ctx, next, urlParts, query, db, koauth);
            return;
        }
        else if (patternActions[ctx.request.body.action]) {
            await patternActions[ctx.request.body.action](ctx, next, urlParts, query, db, koauth);
            return;
        }
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid action'
            }
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
