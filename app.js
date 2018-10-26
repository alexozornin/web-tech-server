'use strict'

const path = require('path');
const Koa = require('koa');
const KoaRouter = require('adv-koa-router');
const afs = require('alex-async-fs');

const app = new Koa();
const globalRouter = new KoaRouter(app);

let indexRoutes = [
    '/',
    '/lab1',
    '/lab2'
]

globalRouter.addIdenticalHandlers('GET', indexRoutes, async (ctx) => {
    ctx.body = await afs.readFileAsync(path.join(__dirname, 'web', 'index.html'), {encoding: 'utf8'});
});

globalRouter.addDynamicDir('GET', '/static', path.join(__dirname, 'web', 'static'), null, {}, {'.css': 'text/css'});

globalRouter.addHandler('GET', '/', (ctx) => {
    ctx.body = 'Alexander Ozornin / #404 Page not found'
}, '$else');

globalRouter.addHandler('POST', '/', (ctx) => {
    ctx.body = 'Alexander Ozornin / #404 Page not found'
}, '$else');

app.listen(80, () => {
    console.log('Server started');
})