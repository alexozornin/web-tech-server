'use strict'

const config = require('../../../../config.json');
const path = require('path');
const crypto = require('crypto');
const afs = require('alex-async-fs');

module.exports = async (ctx, next, urlParts, query, db, koauth) => {
    try {
        let user = await koauth.getUser(ctx);
        if (!user || user.level > config.levels.admin) {
            ctx.status = 403;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Access denied'
                }
            });
            return;
        }
        if (!ctx.request.body.data || !ctx.request.body.encoding) {
            ctx.status = 400;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Bad request'
                }
            });
            return;
        }
        let data = '';
        switch (ctx.request.body.encoding) {
            case 'base64':
                data = ctx.request.body.data.replace(/^data\:image\/\w+\;base64\,/, '');
                if (!ctx.request.body.filename && !ctx.request.body.extension) {
                    let match = ctx.request.body.data.match(/image\/[\w]+/);
                    if (match && match[0]) {
                        ctx.request.body.extension = '.' + match[0].replace(/image\//, '') || '.jpg';
                    }
                    else {
                        ctx.request.body.extension = '.jpg';
                    }
                }
                break;
            default:
                ctx.status = 400;
                ctx.body = JSON.stringify({
                    success: false, error: {
                        code: 0,
                        msg: 'Invalid encoding'
                    }
                });
                return;
        }
        if (!ctx.request.body.filename) {
            ctx.request.body.filename = '' + Date.now() + '-' + crypto.createHash('md5').update('' + Math.random()).digest('hex');
            if (ctx.request.body.extension) {
                ctx.request.body.filename += ctx.request.body.extension;
            }
        }
        await afs.writeFileAsync(path.join(__dirname, '..', '..', '..', '..', 'web', 'images', ctx.request.body.filename), (new Buffer(data, ctx.request.body.encoding)));
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK',
            data: {
                route: '/images/' + ctx.request.body.filename
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