import React, { useEffect } from 'react'
import styled from 'styled-components'
import { ipcRenderer } from 'electron'
import { useMachine } from '@xstate/react'
import uiMachine from '../machines/uiMachine'
import Main from '../components/main.js'
import Peer from '../components/peer.js'
import Settings from '../components/settings.js'
import Socket from '../utils/socket'
import { default as PeerInstance } from '../utils/peer'

console.log(PeerInstance)

import { hot } from 'react-hot-loader/root'

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
`

const Root = () => {
  const [state, send, service] = useMachine(uiMachine)
  const { shortcut, name, friends } = state.context

  // Bind ipcRenderer and socket event
  useEffect(() => {
    console.log('register shortcut-pressed')
    let live = state.context.live
    let updateLive = (state) => {
      live = state.context.live
    }

    // Bind to state transition to keep track of latest live
    service.onTransition(updateLive)

    ipcRenderer.on('shortcut-pressed', () => {
      let nextLive = !live
      console.log('webpage shortcut pressed', live, 'sending:', nextLive)
      send('LIVE', { live: nextLive })
      Socket.sendMessage({
        event: 'live',
        data: {
          enable: nextLive,
        },
      })
    })

    Socket.on('updated_name', (name) => {
      send('NAME', { name })
    })

    Socket.on('statusses', (statusses) => {
      send('FRIENDLIST_STATUSSES', statusses)
    })
  }, [])

  // Update xstate on socket connect and close
  useEffect(() => {
    console.log('here')
    ;(async () => {
      await Socket.connected
      send('PEER', { peer: PeerInstance(service, send) })
      send('SOCKET_STATUS', { connected: true })
      Socket.on('close', () => {
        send('SOCKET_STATUS', { connected: false })
      })
    })()
  }, [])

  // Send name over socket on connect and change
  useEffect(() => {
    ;(async () => {
      await Socket.connected
      Socket.sendName(name)
    })()
  }, [name])

  // Send friendlist over socket on connect and change
  useEffect(() => {
    ;(async () => {
      await Socket.connected
      Socket.sendMessage({
        event: 'friendlist',
        data: {
          friend_list: friends,
        },
      })
    })()
  }, [friends])

  useEffect(() => {
    if (shortcut.length) {
      ipcRenderer.send('registerGlobalShortcut', shortcut.join('+'))
    }
  }, [shortcut])

  let child
  if (state.matches('settings')) {
    child = <Settings state={state} send={send} />
  } else if (state.matches('watch')) {
    child = <Peer state={state} send={send} />
  } else {
    child = <Main state={state} send={send} />
  }
  return <Wrapper>{child}</Wrapper>
}

export default hot(Root)
