require('dotenv').config()
const express = require('express')
const socketio = require('socket.io')
const mongoose = require('mongoose')
require('colors')

const app = express()
const expressServer = app.listen(process.env.PORT)
const io = socketio(expressServer)

const Game = require('./models/Game.js')

const connectDB = mongoose.connect(process.env.MONGO_URI, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
}, () => console.log(`\n** MongoDB is connected`.rainbow))

