import React from 'react'
import { Redirect } from 'react-router'
// import CountDown from './CountDown.jsx'
import StartBtn from './StartBtn.jsx'
import socket from '../socketConfig.js'

const findPlayer = players => {
  return players.find(player => player.socketID === socket.id)
}


const TypeRacer = ({ gameState }) => {

  const { _id, players } = gameState
  const player = findPlayer(players)
  if (_id === '') {
    return <Redirect to='/'/>
  }

  return (
    <div className='text-center'>
      {/* <CountDown /> */}
      <StartBtn player={player} gameID={_id} />
    </div>
  )
}

export default TypeRacer
