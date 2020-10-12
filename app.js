require('dotenv').config()
const express = require('express')
const socketio = require('socket.io')
const mongoose = require('mongoose')
require('colors')

const app = express()
const expressServer = app.listen(process.env.PORT)
const io = socketio(expressServer)

const Game = require('./models/Game.js')
const QuotableAPI = require('./QuotableAPI.js')

const connectDB = mongoose.connect(
  process.env.MONGO_URI,
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => console.log(`\n** MongoDB is connected`.rainbow)
)

io.on('connect', (socket) => {
  socket.on('timer', async ({ gameID, playerID }) => {
    let countDown = 5
    let game = await Game.findById(gameID)
    let player = game.players.id(playerID)
    if (player.isPartyLeader) {
      let timerID = setInterval(async () => {
        if (countDown >= 0) {
          io.to(gameID).emit('timer', { countDown, msg: 'Starting game' })
          countDown--
        } else {
          game.isOpen = false
          game = await game.save()
          io.to(gameID).emit('udpateGame', game)
          // startGameClock(gameID)
          clearInterval(timerID)
        }
      }, 1000)
    }
  })

  socket.on('join-game', async ({ gameID: _id, nickName }) => {
    try {
      let game = await Game.findById(_id)
      if (game.isOpen) {
        const gameID = (await game)._id.toString()
        socket.join(gameID)
        let player = {
          socketID: socket.id,
          nickName,
        }
        game.players.push(player)
        game = await game.save()
        io.to(gameID).emit('updateGame', game)
      }
    } catch (error) {
      console.log(err)
    }
  })

  socket.on('create-game', async (nickName) => {
    try {
      const quotableData = await QuotableAPI()
      let game = new Game()
      game.words = quotableData
      let player = {
        socketID: socket.id,
        isPartyLeader: true,
        nickName,
      }
      game.players.push(player)
      game = await game.save()

      const gameID = game._id.toString()
      socket.join(gameID)
      io.to(gameID).emit('updateGame', game)
    } catch (err) {
      console.log(err)
    }
  })
})
