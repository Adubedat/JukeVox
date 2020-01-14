'use strict';

const User = require("../models/userModel");

exports.createUser = function(req, res) {
    console.log("wollah");
    User.createUser({username: "Bob"})
        .then(function(response) {
            console.log(response);
            res.send(response);
        })
};
