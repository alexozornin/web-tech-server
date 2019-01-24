'use strict'

const config = require('../../../../config.json');
const path = require('path');
const afs = require('alex-async-fs');
const ah = require('alex-hash');
const Mail = require('alex-mail');
const mail = new Mail(config.smtp.from, config.smtp.host, config.smtp.post, config.smtp.secure, config.smtp.username, config.smtp.password);

const userKeys = ['id', 'name', 'email', 'level', 'phone'];

function sendMail(email, userId, token) {
    console.log('email', email);
    console.log('userId', userId);
    console.log('token', token);
    mail.send(email, 'Web Tech: Sign Up', null, '<div>От вашего email поступил запрос на регистрацию в сервисе "Web Tech"</div>\
<div>Чтобы подтвердить ваш email, нажмите на кнопку ниже</div>\
<a href="' + config.server.redirectUrl + '/confirmemail?user=' + userId + '&token=' + token + '" style="cursor:pointer;width:min-content;background-color:#aaaaaa;font-size:20px" onClick=\'location.href=\'>Подтвердить</a>\
<div>Если это были не Вы, просто проигнорируйте это письмо.</div>'
    )
}

async function getUserById(ctx, next, urlParts, query, db, koauth) {
    if (!ctx.request.body.params || !ctx.request.body.params.id) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    let user = await koauth.getUser(ctx);
    if (!user || (ctx.request.body.params.id != user.id && user.level > config.levels.admin)) {
        ctx.status = 403;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Access denied'
            }
        });
        return;
    }
    try {
        let res = await db.models['users'].findOne({
            where: {
                id: ctx.request.body.params.id
            }
        });
        if (res && res.dataValues) {
            res = res.dataValues;
        }
        for (let key in res) {
            if (!userKeys.includes(key)) {
                delete res[key];
            }
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
        ctx.status = 500;
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

async function getUsers(ctx, next, urlParts, query, db, koauth) {
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
    if (!ctx.request.body.params || !ctx.request.body.params.where) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    try {
        let res = await db.models['users'].findAll({
            where: ctx.request.body.params.where
        });
        if (Array.isArray(res)) {
            for (let i = 0; i < res.length; i++) {
                if (res[i].dataValues) {
                    res[i] = res[i].dataValues
                }
                for (let key in res[i]) {
                    if (!userKeys.includes(key)) {
                        delete res[i][key];
                    }
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
        ctx.status = 500;
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

async function addUser(ctx, next, urlParts, query, db, koauth) {
    if (!ctx.request.body.params || !ctx.request.body.params.data) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    try {
        if (!ctx.request.body.params.data.email || !ctx.request.body.params.data.password) {
            ctx.status = 400;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Invalid data'
                }
            });
            return;
        }
        let salt = ah.createSalt(ctx.request.body.params.data.password);
        let hash = ah.createHash(ctx.request.body.params.data.password, salt, config.security.local);
        let sessionSalt = ah.createSalt(ctx.request.body.params.data.email);
        let session = ah.createHash(ctx.request.body.params.data.email, sessionSalt, config.security.local);
        ctx.request.body.params.data.level = config.levels.ticket;
        ctx.request.body.params.data.salt = salt;
        ctx.request.body.params.data.password = hash;
        ctx.request.body.params.data.session = session;
        let res = await db.models['users'].create(ctx.request.body.params.data);
        if (res.dataValues) {
            res = res.dataValues;
        }
        for (let key in res) {
            if (!userKeys.includes(key)) {
                delete res[key];
            }
        }
        sendMail(ctx.request.body.params.data.email, res.id, session);
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
                msg: 'Internal server error, try another input'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}

async function editUserById(ctx, next, urlParts, query, db, koauth) {
    if (!ctx.request.body.params || !ctx.request.body.params.id || !ctx.request.body.params.data) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    let user = await koauth.getUser(ctx);
    if (!user || (ctx.request.body.params.id != user.id && user.level > config.levels.admin)) {
        ctx.status = 403;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Access denied'
            }
        });
        return;
    }
    try {
        let editedUser = await db.models['users'].findOne({
            where: {
                id: ctx.request.body.params.id
            }
        });
        if (editedUser.dataValues) {
            editedUser = editedUser.dataValues;
        }
        if (editedUser.level <= config.levels.admin && ctx.request.body.params.id != user.id && (user.level >= editedUser.level || user.level == 0)) {
            ctx.status = 403;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Access denied'
                }
            });
            return;
        }
        if (editedUser.level == 0 && ctx.request.body.params.data.level) {
            ctx.status = 403;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Root user cannot be downgraded'
                }
            });
            return;
        }
        if (ctx.request.body.params.data.level && ctx.request.body.params.data.level < user.level) {
            ctx.status = 403;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Access denied'
                }
            });
            return;
        }
        if (ctx.request.body.params.data.level) {
            if (ctx.request.body.params.data.level > user.level) {
                ctx.status = 403;
                ctx.body = JSON.stringify({
                    success: false, error: {
                        code: 0,
                        msg: 'Access denied'
                    }
                });
                return;
            }
        }
        if (ctx.request.body.params.data.id) {
            delete ctx.request.body.params.data.id;
        }
        if (ctx.request.body.params.data.salt) {
            delete ctx.request.body.params.data.salt;
        }
        if (ctx.request.body.params.data.password) {
            let salt = ah.createSalt(ctx.request.body.params.data.password);
            let hash = ah.createHash(ctx.request.body.params.data.password, salt, config.security.local);
            ctx.request.body.params.data.salt = salt;
            ctx.request.body.params.data.password = hash;
        }
        await db.models['users'].update(ctx.request.body.params.data, {
            where: {
                id: ctx.request.body.params.id
            }
        });
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
                msg: 'Internal server error, try another input'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}

async function removeUserById(ctx, next, urlParts, query, db, koauth) {
    if (!ctx.request.body.params || !ctx.request.body.params.id) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    let user = await koauth.getUser(ctx);
    if (!user || (ctx.request.body.params.id != user.id && user.level > config.levels.admin)) {
        ctx.status = 403;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Access denied'
            }
        });
        return;
    }
    try {
        let editedUser = await db.models['users'].findOne({
            where: {
                id: ctx.request.body.params.id
            }
        });
        if (editedUser.dataValues) {
            editedUser = editedUser.dataValues;
        }
        if (editedUser.level <= config.levels.admin && ctx.request.body.params.id != user.id && (user.level >= editedUser.level || user.level == 0)) {
            ctx.status = 403;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Access denied'
                }
            });
            return;
        }
        if (editedUser.level == 0) {
            ctx.status = 403;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Root user cannot be removed'
                }
            });
            return;
        }
        await db.models['users'].destroy({
            where: {
                id: ctx.request.body.params.id
            }
        });
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
                msg: 'Internal server error, try another input'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}

async function addGood(ctx, next, urlParts, query, db, koauth) {
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
    if (!ctx.request.body.params || !ctx.request.body.params.data) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    if (!db.models['goods']) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid model'
            }
        });
        return;
    }
    try {
        ctx.request.body.params.data.time = Date.now();
        let res = await db.models['goods'].create(ctx.request.body.params.data);
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
                msg: 'Internal server error, try another input'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}

async function editGood(ctx, next, urlParts, query, db, koauth) {
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
        if (!ctx.request.body.params || !ctx.request.body.params.where || !ctx.request.body.params.data) {
            ctx.status = 400;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Invalid params'
                }
            });
            return;
        }
        if (ctx.request.body.params.data.id) {
            delete ctx.request.body.params.data.id;
        }
        if (ctx.request.body.params.data.photo) {
            let current = await db.models['goods'].findAll({
                where: ctx.request.body.params.where
            });
            if (Array.isArray(current)) {
                for (let i = 0; i < current.length; i++) {
                    if (current[i].dataValues) {
                        current[i] = current[i].dataValues;
                    }
                    if (current[i].photo) {
                        let paths = current[i].photo.split('/');
                        paths[0] = 'web';
                        afs.unlinkAsync(path.join(__dirname, '..', '..', '..', '..', ...paths));
                    }
                }
            }
        }
        ctx.request.body.params.data.time = Date.now();
        await db.models['goods'].update(ctx.request.body.params.data, {
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
        ctx.status = 500;
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

async function removeGood(ctx, next, urlParts, query, db, koauth) {
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
    if (!ctx.request.body.params || !ctx.request.body.params.where) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    try {
        let goods = await db.models['goods'].findAll({
            where: ctx.request.body.params.where
        });
        if (Array.isArray(goods)) {
            for (let i = 0; i < goods.length; i++) {
                if (goods[i].dataValues) {
                    goods[i] = goods[i].dataValues;
                }
                if (goods[i].photo) {
                    let paths = goods[i].photo.split('/');
                    paths[0] = 'web';
                    afs.unlinkAsync(path.join(__dirname, '..', '..', '..', '..', ...paths));
                }
            }
        }
        await db.models['goods'].destroy({
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
        ctx.status = 500;
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

async function markGoodsForDelete(ctx, next, urlParts, query, db, koauth) {
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
        if (!ctx.request.body.params || !ctx.request.body.params.where) {
            ctx.status = 400;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Invalid params'
                }
            });
            return;
        }
        let current = await db.models['goods'].findAll({
            where: ctx.request.body.params.where
        });
        if (Array.isArray(current)) {
            for (let i = 0; i < current.length; i++) {
                if (current[i].dataValues) {
                    current[i] = current[i].dataValues;
                }
                if (current[i].photo) {
                    let paths = current[i].photo.split('/');
                    paths[0] = 'web';
                    afs.unlinkAsync(path.join(__dirname, '..', '..', '..', '..', ...paths));
                }
            }
        }
        await db.models['goods'].update({
            active: 0,
            description: 'Товар продан или удален',
            photo: '',
            time: Date.now()
        }, {
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
        ctx.status = 500;
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


async function editCategory(ctx, next, urlParts, query, db, koauth) {
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
        if (!ctx.request.body.params || !ctx.request.body.params.where || !ctx.request.body.params.data) {
            ctx.status = 400;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Invalid params'
                }
            });
            return;
        }
        if (ctx.request.body.params.data.id) {
            delete ctx.request.body.params.data.id;
        }
        if (ctx.request.body.params.data.photo) {
            let current = await db.models['categories'].findAll({
                where: ctx.request.body.params.where
            });
            if (Array.isArray(current)) {
                for (let i = 0; i < current.length; i++) {
                    if (current[i].dataValues) {
                        current[i] = current[i].dataValues;
                    }
                    if (current[i].photo) {
                        let paths = current[i].photo.split('/');
                        paths[0] = 'web';
                        afs.unlinkAsync(path.join(__dirname, '..', '..', '..', '..', ...paths));
                    }
                }
            }
        }
        await db.models['categories'].update(ctx.request.body.params.data, {
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
        ctx.status = 500;
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

async function removeCategory(ctx, next, urlParts, query, db, koauth) {
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
    if (!ctx.request.body.params || !ctx.request.body.params.where) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    try {
        let categories = await db.models['categories'].findAll({
            where: ctx.request.body.params.where
        });
        if (Array.isArray(categories)) {
            for (let i = 0; i < categories.length; i++) {
                if (categories[i].dataValues) {
                    categories[i] = categories[i].dataValues;
                }
                if (categories[i].photo) {
                    let paths = categories[i].photo.split('/');
                    paths[0] = 'web';
                    afs.unlinkAsync(path.join(__dirname, '..', '..', '..', '..', ...paths));
                }
            }
        }
        await db.models['categories'].destroy({
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
        ctx.status = 500;
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

async function getAllCategories(ctx, next, urlParts, query, db, koauth) {
    try {
        let res = await db.models['categories'].findAll({
            where: {
                name: {
                    $ne: 'Другое'
                }
            }
        });
        if (Array.isArray(res)) {
            for (let i = 0; i < res.length; i++) {
                if (res[i].dataValues) {
                    res[i] = res[i].dataValues;
                }
            }
        }
        else {
            res = [];
        }
        let res2 = await db.models['categories'].findAll({
            where: {
                name: 'Другое'
            }
        });
        if (Array.isArray(res2)) {
            for (let i = 0; i < res2.length; i++) {
                if (res2[i].dataValues) {
                    res2[i] = res2[i].dataValues;
                }
            }
        }
        else {
            res2 = [];
        }
        res.push(...res2);
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
                msg: 'Internal server error, try another input'
            }
        });
        console.log('/database ERR', err);
        return;
    }
}

async function getVariable(ctx, next, urlParts, query, db, koauth) {
    if (!ctx.request.body.params || !ctx.request.body.params.name) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    try {
        let res = await db.models['variables'].findOne({
            where: {
                name: ctx.request.body.params.name
            }
        });
        if (res && res.dataValues) {
            res = res.dataValues;
        }
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK',
            data: res.val || null
        });
        return;
    }
    catch (err) {
        ctx.status = 500;
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

async function setVariable(ctx, next, urlParts, query, db, koauth) {
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
    if (!ctx.request.body.params || !ctx.request.body.params.name || !ctx.request.body.params.val) {
        ctx.status = 400;
        ctx.body = JSON.stringify({
            success: false, error: {
                code: 0,
                msg: 'Invalid params'
            }
        });
        return;
    }
    try {
        let res = await db.models['variables'].findOne({
            where: {
                name: ctx.request.body.params.name
            }
        });
        if (res) {
            await db.models['variables'].update({ val: ctx.request.body.params.val }, {
                where: {
                    name: ctx.request.body.params.name
                }
            });
        }
        else {
            await db.models['variables'].create({
                name: ctx.request.body.params.name,
                val: ctx.request.body.params.val
            });
        }
        ctx.status = 200;
        ctx.body = JSON.stringify({
            success: true,
            msg: 'OK',
            data: res.val || null
        });
        return;
    }
    catch (err) {
        ctx.status = 500;
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
    users: {
        getById: getUserById,
        get: getUsers,
        add: addUser,
        editById: editUserById,
        removeById: removeUserById
    },
    goods: {
        add: addGood,
        edit: editGood,
        remove: removeGood,
        markForDelete: markGoodsForDelete
    },
    categories: {
        getAll: getAllCategories,
        edit: editCategory,
        remove: removeCategory
    },
    variables: {
        get: getVariable,
        set: setVariable
    }
}
