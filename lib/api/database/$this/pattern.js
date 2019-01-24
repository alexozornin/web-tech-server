'use strict'

const config = require('../../../../config.json');

async function getById(ctx, next, urlParts, query, db, koauth) {
    if (!ctx.request.body.params || !ctx.request.body.params.id) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    if (!db.models[ctx.request.body.model]) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid model'
            }
        });
        return;
    }
    try {
        let res = await db.models[ctx.request.body.model].findOne({
            where: {
                id: ctx.request.body.params.id
            }
        });
        if (res && res.dataValues) {
            res = res.dataValues;
        }
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK',
            data: res || null
        });
        return;
    }
    catch (err) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Internal server error, try another input'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}

async function get(ctx, next, urlParts, query, db, koauth) {
    if (!ctx.request.body.params || !ctx.request.body.params.where) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    if (!db.models[ctx.request.body.model]) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid model'
            }
        });
        return;
    }
    try {
        let res = await db.models[ctx.request.body.model].findAll({
            where: ctx.request.body.params.where
        });
        if (Array.isArray(res)) {
            for (let i = 0; i < res.length; i++) {
                if (res[i].dataValues) {
                    res[i] = res[i].dataValues;
                }
            }
        }
        else {
            res = null;
        }
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK',
            data: res
        });
        return;
    }
    catch (err) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Internal server error, try another input'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}

async function add(ctx, next, urlParts, query, db, koauth) {
    let user = await koauth.getUser(ctx);
    if (!user || user.level > config.levels.admin) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Access denied'
            }
        });
        return;
    }
    if (!ctx.request.body.params || !ctx.request.body.params.data) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    if (!db.models[ctx.request.body.model]) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid model'
            }
        });
        return;
    }
    try {
        let res = await db.models[ctx.request.body.model].create(ctx.request.body.params.data);
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK',
            data: res
        });
        return;
    }
    catch (err) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Internal server error, try another input'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}

async function edit(ctx, next, urlParts, query, db, koauth) {
    let user = await koauth.getUser(ctx);
    if (!user || user.level > config.levels.admin) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Access denied'
            }
        });
        return;
    }
    if (!ctx.request.body.params || !ctx.request.body.params.where || !ctx.request.body.params.data) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    if (!db.models[ctx.request.body.model]) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid model'
            }
        });
        return;
    }
    try {
        if (ctx.request.body.params.data.id) {
            delete ctx.request.body.params.data.id;
        }
        await db.models[ctx.request.body.model].update(ctx.request.body.params.data, {
            where: ctx.request.body.params.where
        });
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK'
        });
        return;
    }
    catch (err) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Internal server error, try another input'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}

async function remove(ctx, next, urlParts, query, db, koauth) {
    let user = await koauth.getUser(ctx);
    if (!user || user.level > config.levels.admin) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Access denied'
            }
        });
        return;
    }
    if (!ctx.request.body.params || !ctx.request.body.params.where) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    if (!db.models[ctx.request.body.model]) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid model'
            }
        });
        return;
    }
    try {
        await db.models[ctx.request.body.model].destroy({
            where: ctx.request.body.params.where
        });
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK'
        });
        return;
    }
    catch (err) {
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Internal server error, try another input'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}

module.exports = {
    getById,
    get,
    add,
    edit,
    remove
}
