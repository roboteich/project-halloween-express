var async = require('async');

module.exports = function(app, io) {
    
    //Home route
    var index = require('../app/controllers/index');
    app.get('/', index.render);

};