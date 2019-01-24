'use strict'

const config = require('../../config.json');
const request = require('./request.js');

function compareDesCount(obj1, obj2) {
    return obj2.count - obj1.count;
}

module.exports = async (vacancies) => {
    let obj = {};
    for (let i = 0; i < 20; i++) {
        let data = await request(`http://api.hh.ru/vacancies?only_with_salary=true&per_page=100&page=${i}`, {
            headers: {
                'User-Agent': 'Node.js Server'
            }
        });
        data = JSON.parse(data);
        if (data.items && Array.isArray(data.items)) {
            for (let j = 0; j < data.items.length; j++) {
                let name, salary, requirements = [];
                name = data.items[j].name
                if (data.items[j].salary) {
                    if (data.items[j].salary.from && data.items[j].salary.to) {
                        salary = (data.items[j].salary.from + data.items[j].salary.to) / 2;
                    }
                    else if (data.items[j].salary.from) {
                        salary = data.items[j].salary.from;
                    }
                    else if (data.items[j].salary.to) {
                        salary = data.items[j].salary.to;
                    }
                    else {
                        continue;
                    }
                    if (data.items[j].salary.currency in config.currencies) {
                        salary *= config.currencies[data.items[j].salary.currency];
                    }
                    else {
                        continue;
                    }
                }
                else {
                    continue;
                }
                if (data.items[j].snippet && data.items[j].snippet.requirement) {
                    requirements = data.items[j].snippet.requirement.split(/[;\.]/gmi);
                    if (!Array.isArray(requirements)) {
                        requirements = [];
                    }
                }
                if (name in obj) {
                    obj[name].count++;
                    for (let k = 0; k < requirements.length; k++) {
                        if (requirements[k]) {
                            if (requirements[k] in obj[name].req) {
                                obj[name].req[requirements[k]]++;
                            }
                            else {
                                obj[name].req[requirements[k]] = 1;
                            }
                        }
                    }
                }
                else {
                    obj[name] = {
                        count: 1,
                        salary,
                        req: {}
                    }
                    for (let k = 0; k < requirements.length; k++) {
                        if (requirements[k]) {
                            if (requirements[k] in obj[name].req) {
                                obj[name].req[requirements[k]]++;
                            }
                            else {
                                obj[name].req[requirements[k]] = 1;
                            }
                        }
                    }
                }
            }
        }
    }
    for (let key in obj) {
        let req = [];
        for (let reqey in obj[key].req) {
            req.push({
                name: reqey,
                count: obj[key].req[reqey]
            });
        }
        for (let i = 0; i < req.length; i++) {
            if (req[i] && req[i].name) {
                req[i] = req[i].name;
            }
            if (typeof req[i] == 'object') {
                console.log(req[i]);
            }
        }
        req.sort(compareDesCount);
        req.length = Math.min(req.length, 3);
        obj[key].req = req.join('. ').replace('&quot', '');
        obj[key].name = key;
        vacancies.push(obj[key]);
    }
    vacancies.sort(compareDesCount);
}
