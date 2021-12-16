const express = require('express')
const app = express()
const routes = require("./src/routes")

app.use('/', routes)
var port = 3000;

app.listen(port, function () {
    console.log('App listening on port - %s', port);
})

module.exports = app;