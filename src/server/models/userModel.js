'use strict';

exports.createUser = function(user) {
    return new Promise(function(resolve, reject) {
        setTimeout(() => {
            resolve("New user created, took me only 1 sec");
        }, 1000)
    })
};