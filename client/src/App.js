import React from 'react'
import { Router, Route, Switch } from 'react-router'
import history from './history.js'
import GameMenu from './components/GameMenu.jsx'

const App = () => {
  return (
    <Router history={history}>
      <Switch>
        <Route exact path='/' component={GameMenu} />
      </Switch>
    </Router>
  )
}

export default App
