import React, { useEffect, useState } from 'react'
import { Router, Route, Switch } from 'react-router'
import history from './history.js'
import GameMenu from './components/GameMenu.jsx'
import CreateGame from './components/CreateGame.jsx'
import socket from './socketConfig.js'

const App = () => {
  const [gameState, setGameState] = useState({
    _id: '',
    isOpen: false,
    players: [],
    words: [],
  })

  useEffect(() => {
    socket.on('updateGame', (game) => {
      console.log(game)
      setGameState(game)
    })
    return () => {
      socket.removeAllListeners()
    }
  }, [])

  useEffect(() => {
    if (gameState._id !== '') {
      history.push(`/game/${gameState._id}`)
    }
  }, [gameState._id])

  return (
    <Router history={history}>
      <Switch>
        <Route exact path='/' component={GameMenu} />
        <Route path='/game/create' component={CreateGame} />
      </Switch>
    </Router>
  )
}

export default App
