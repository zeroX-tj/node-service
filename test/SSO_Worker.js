"use strict";
module.exports = {
    data: {},
    handlers: {
        TakeSnapshot: (req, rep) => {
            rep(null, {w00t: 't00t'})
        }
    }
};