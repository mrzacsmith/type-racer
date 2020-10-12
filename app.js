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
          startGameClock(gameID)
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

const startGameClock = async (gameID) => {
  let game = await Game.findById(gameID)
  game.startTime = new Date().getTime()
  game = await game.save()

  let time = 10
  let timerID = setInterval(
    (function gameIntervalFunc() {
      if (time >= 0) {
        const formatTime = calculateTime(time)
        io.to(gameID).emit('timer', {
          countDown: formatTime,
          msg: 'Time Remaining',
        })
        time--
      } else {
        ;(async () => {
          let endTime = new Date().getTime()
          let game = await Game.findById(gameID)
          let { startTime } = game
          game.isOver = true
          game.players.forEach((player, index) => {
            if (player.WPM === -1) {
              game.players[index].WPM = calculateWPM(endTime, startTime, player)
            }
          })
          game = await game.save()
          io.to(gameID).emit('updateGame', game)
          clearInterval(timerID)
        })()
      }
      return gameIntervalFunc
    })(),
    1000
  )
}

const calculateTime = (time) => {
  let minutes = Math.floor(time / 60)
  let seconds = time % 60
  return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`
}

const calculateWPM = (endTime, startTime, player) => {
  let numOfWords = player.currentWordIndex
  const timeInSeconds = (endTime - startTime) / 1000
  const timeInMinutes = timeInSeconds / 60
  const WPM = Math.floor(numOfWords / timeInMinutes)
  return WPM
}
