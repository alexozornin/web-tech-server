'use strict'

const request = require('./request.js');

module.exports = async (vacancies = []) => {
    for (let i = 1; i <= 20; i++) {
        let data = await request(`http://api.hh.ru/vacancies?only_with_salary=true&per_page=100&page=${i}`);
        if (data.items && Array.isArray(data.items)) {
            for (let j = 0; j < data.items.length; j++) {
                let obj = {
                    name: data.items[j].name
                }
                if (data.items[j].salary) {
                    if (data.items[j].salary.from && data.items[j].salary.to) {
                        obj.salary = (data.items[j].salary.from + data.items[j].salary.to) / 2;
                    }
                    else if (data.items[j].salary.from) {
                        obj.salary = data.items[j].salary.from;
                    }
                    else if (data.items[j].salary.to) {
                        obj.salary = data.items[j].salary.to;
                    }
                }
                if (data.items[j].snippet && data.items[j].snippet.requirement) {
                    obj.req = data.items[j].snippet.requirement;
                }
                vacancies.push(obj);
            }
        }
    }
}