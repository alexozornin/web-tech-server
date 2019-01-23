'use strict'

const config = require('../../../../config.json');
const Mail = require('alex-mail');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const mail = new Mail(config.smtp.from, config.smtp.host, config.smtp.post, config.smtp.secure, config.smtp.username, config.smtp.password);

module.exports = async (ctx, next, urlParts, query, db, koauth) => {
    try {
        if (!ctx.request.body.name || (!ctx.request.body.phone && !ctx.request.body.email) || !ctx.request.body.message) {
            ctx.status = 400;
            ctx.body = JSON.stringify({
                success: false, error: {
                    code: 0,
                    msg: 'Invalid request request'
                }
            });
            return;
        }
        let html = '<div style="font-size:20px">Обращение<div><div style="font-size:16px">Клиент:</div>';
        if (ctx.request.body.phone) {
            html += `<div>Телефон: ${ctx.request.body.phone}</div>`;
        }
        if (ctx.request.body.email) {
            html += `<div>Email: ${ctx.request.body.email}</div>`;
        }
        html += '<div style="font-size:16px">Сообщение:</div>';
        html += `<div>${ctx.request.body.message}</div>`;
        mail.send(config.emails.feedback, 'Обращение', null, html);
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