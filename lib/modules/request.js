'use strict'

const request = require('request');

module.exports = (url, options = {}) => {
    return new Promise((resolve) => {
        request(url, options, (error, response, body) => {
            if (error) {
                resolve(null);
            }
            else {
                resolve(body);
            }
        });
        setTimeout(() => {
            resolve(null);
        }, 60000);
    })
}