'use strict'

const config = require('./config.json');
const path = require('path');
const Database = require('./lib/database/index.js');
const Koa = require('koa');
const KoaRouter = require('adv-koa-router');
const Koauth = require('koauth');
const bodyparser = require('koa-bodyparser');
const afs = require('alex-async-fs');

const publicRoutes = [
    '/',
    '/lab1',
    '/lab2'
];

(async () => {
    const app = new Koa();
    app.use(bodyparser({ jsonLimit: '64mb' }));
    const globalRouter = new KoaRouter(app, []);
    const db = new Database();
    await db.init();

    const getUserById = async (userId) => {
        let user = await db.models['users'].findOne({
            where: {
                id: userId
            }
        });
        if (!user) {
            return null;
        }
        return user.dataValues || user;
    }

    const signInUser = async (ctx, db) => {
        let user = await db.models['users'].findOne({
            where: {
                email: ctx.request.body.email
            }
        });
        if (!user) {
            return null;
        }
        if (user.dataValues) {
            user = user.dataValues;
        }
        if (ah.check(ctx.request.body.password, user.salt, config.security.local, user.password)) {
            return user.id;
        }
        return null;
    }
    const signOutUser = async () => {

    }

    const getSessionByUserId = async (userId) => {
        let user = await getUserById(userId);
        if (user && user.session) {
            return user.session;
        }
        return null;
    }

    const setSessionByUserId = async (userId, session) => {
        await db.models['users'].update({ session }, {
            where: {
                id: userId
            }
        });
    }

    const koauthOptions = {
        key32: config.security.key32,
        key16: config.security.key16,
        sessionStorage: 'custom',
        sessionDirPath: path.join(__dirname, 'sessions'),
        getSessionByUserId,
        setSessionByUserId
    };

    const koauth = new Koauth(getUserById, signInUser, signOutUser, koauthOptions);
    globalRouter.addParams(db, koauth);

    const p403 = await afs.readFileAsync(path.join(__dirname, 'lib', 'pages', '403.html'), { encoding: 'utf8' });
    const p404 = await afs.readFileAsync(path.join(__dirname, 'lib', 'pages', '404.html'), { encoding: 'utf8' });

    globalRouter.addIdenticalHandlers('GET', publicRoutes, async (ctx) => {
        ctx.body = await afs.readFileAsync(path.join(__dirname, 'web', 'index.html'), { encoding: 'utf8' });
    });

    globalRouter.addDynamicDir('GET', '/static', path.join(__dirname, 'web', 'static'), null, {}, { '.js': 'text/javascript', '.css': 'text/css' });

    globalRouter.addHandler('GET', '/', (ctx) => {
        ctx.body = p404;
    }, '$else');

    globalRouter.addHandler('POST', '/', (ctx) => {
        ctx.body = p404;
    }, '$else');

    app.listen(config.server.port, () => {
        console.log('Server started on', config.server.port);
    })
})();
