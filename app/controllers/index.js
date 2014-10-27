/**
 * Module dependencies.
 */
var async = require('async'),
    _ = require('underscore');


exports.render = function(req, res) {
	//provision room
    res.render('index');
};
