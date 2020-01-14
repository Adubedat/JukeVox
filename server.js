'use strict'

const express = require('express')
const params = require('./params')
const routes = require('./src/server/routes')

const mysql = require('mysql')

// local mysql db connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
})

connection.connect(function (err) {
  if (err) throw err
  console.log('Connected!')
  const query = 'CREATE DATABASE IF NOT EXISTS JukeVox'
  connection.query(query, function (err, result) {
    if (err) throw err
    console.log('Database created')
  })
})

connection.destroy()

const port = process.env.PORT || params.port
const app = express()

app.listen(port)
routes(app)

console.log('Music Room RESTful API server started on port: ' + port)
