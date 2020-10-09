import React, { useState } from 'react'
import styled from 'styled-components'

import { ReactComponent as SettingsIcon } from '../assets/icons/settings.svg'
import { ReactComponent as InfoIcon } from '../assets/icons/info.svg'

const Controls = styled.div`
  align-self: flex-end;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: #1d242e;
  padding: 5px 10px;
  border-radius: 20px;
  position: absolute;
  top: 20px;
  right: 20px;
`

const SocketStatus = styled.div`
  background: ${(props) =>
    props.live ? '#E4532D' : props.status ? '#5eff5e' : '#A6A8B2'};
  width: 10px;
  height: 10px;
  border-radius: 10px;
  margin: 0 10px;
`

const Settings = styled.div`
  svg path {
    fill: white;
  }
  height: 24px;
  width: 24px;
  cursor: pointer;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const FriendList = styled.div`
  background-color: #1d242e;
  padding: 40px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  width: 250px;
`

const Title = styled.h2`
  margin-top: 0;
`

const Info = styled.div`
  margin-top: 40px;
  background-color: #1d242e;
  padding: 15px 20px;
  border-radius: 40px;
  display: flex;
  opacity: 0.6;
  align-items: center;

  svg {
    margin-right: 5px;
    path {
      fill: white;
    }
  }
`

const Highlight = styled.span`
  color: #986eff;
`

const HR = styled.hr`
  border-color: rgba(255, 255, 255, 0.1);
  width: 100%;
  margin: 20px 0;
`

const Input = styled.input`
  background: transparent;
  border: 2px solid #676d75;
  border-radius: 20px;
  padding: 10px 15px;
  color: white;
  outline: none;
  font-size: 14px;
  font-family: Varela;
  flex-shrink: 1;
  width: 120px;
`

const AddFriend = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const PrimaryButton = styled.button`
  background: #986eff;
  border-radius: 20px;
  border: none;
  padding: 10px 15px;
  color: white;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  align-self: center;
  flex-shrink: 0;
`

const Friend = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2px 0;
  cursor: ${(props) => (props.isLive ? 'pointer' : 'auto')};
  height: 45px;
`

const Name = styled.div``

const FriendStatusOther = styled.div`
  background: ${(props) =>
    props.status === 'live'
      ? '#E4532D'
      : props.status === 'online'
      ? '#5eff5e'
      : '#A6A8B2'};
  width: 10px;
  height: 10px;
  border-radius: 10px;
  margin: 0 10px;
`

const FriendStatusLive = styled.div`
  background: #e4532d;
  padding: 3px 7px;
  text-transform: uppercase;
  border-radius: 20px;
  font-size: 13px;
  font-family: M_PLUS;
  font-weight: bold;
`

const FriendStatus = ({ status }) => {
  if (status === 'live') {
    return <FriendStatusLive>Live</FriendStatusLive>
  }
  return <FriendStatusOther status={status} />
}

const Main = (props) => {
  const { state, send } = props
  const { context } = state

  const [addFriend, setAddFriend] = useState('')

  const watchStream = (name) => {
    console.log('watchStream', context.friendListStatusses[name])
    if (context.friendListStatusses[name] !== 'live') return

    let id = context.friendListIds[name]
    console.log('sending watch', id)
    send('WATCH', { id })
  }

  return (
    <>
      <Controls>
        <span>{context.name}</span>
        <SocketStatus status={context.socketConnected} live={context.live} />
        <Settings onClick={() => send('SETTINGS')}>
          <SettingsIcon width={24} height={24} />
        </Settings>
      </Controls>
      <Content>
        <FriendList>
          <Title>Friends</Title>
          {context.friends.map((name, i) => (
            <Friend
              key={i}
              isLive={context.friendListStatusses[name] === 'live'}
              onClick={() => watchStream(name)}
            >
              <Name>{name}</Name>
              <FriendStatus status={context.friendListStatusses[name]} />
            </Friend>
          ))}
          <HR />
          <AddFriend>
            <Input
              value={addFriend}
              onChange={(e) => setAddFriend(e.target.value)}
              placeholder="Friend's name"
            />
            <PrimaryButton
              onClick={() => {
                send('ADD_FRIEND', { friend: addFriend })
                setAddFriend('')
              }}
            >
              Add
            </PrimaryButton>
          </AddFriend>
        </FriendList>
        <Info>
          <InfoIcon width={24} height={24} />
          <span>
            Press <Highlight>{context.shortcut.join(' + ')}</Highlight> while
            ingame to go live yourself.
          </span>
        </Info>
      </Content>
    </>
  )
}

export default Main
