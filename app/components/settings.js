import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import hotkeys from 'hotkeys-js'

// Color scheme
// Dark: #181D36
// Red: #E4532D
// Orange: #F2A944
// Yellow: #F5D759
// Light blue: #84BFDF
// Blue: #5593D7
// Purple: #986EFF
// Green: #5EFF5E

const Wrapper = styled.div`
  background-color: #1d242e;
  padding: 40px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  width: 250px;
`

const Input = styled.input`
  background: transparent;
  border: 2px solid #676d75;
  border-radius: 20px;
  padding: 10px 15px;
  color: white;
  outline: none;
  margin-bottom: 20px;
  font-size: 14px;
  font-family: Varela;
`

const Button = styled.button`
  background: ${(props) => (props.listening ? '#5593D7' : 'transparent')};
  border: 2px solid ${(props) => (props.listening ? 'white' : '#676d75')};
  border-radius: 20px;
  padding: 10px 15px;
  color: white;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  position: relative;
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
  margin-top: 20px;
`

const Title = styled.h2`
  margin-top: 0;
`

const Stop = styled.div`
  position: absolute;
  right: 7px;
  top: 7px;
  bottom: 7px;
  width: 23px;
  border-radius: 20px;
  background: white;
  color: black;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
`

const Settings = (props) => {
  const { state, send } = props
  const { context } = state
  const [name, setName] = useState(context.name)
  const [listening, setListening] = useState(false)
  const [shortcut, setShortcut] = useState(context.shortcut)

  useEffect(() => {
    if (listening) {
      hotkeys('*', (e) => {
        if (e.key === 'Escape') {
          setListening(false)
          return
        }

        e.preventDefault()
        let shortcut = []

        if (hotkeys.shift && e.key !== 'Shift') {
          shortcut.push('Shift')
        }

        if (hotkeys.control && e.key !== 'Control') {
          shortcut.push('Control')
        }

        if (hotkeys.alt && e.key !== 'Alt') {
          shortcut.push('Alt')
        }

        shortcut.push(e.key)
        setShortcut(shortcut)
        console.log('shortcut', shortcut)
      })
    } else {
      hotkeys.unbind('*')
    }

    return () => {
      hotkeys.unbind('*')
    }
  }, [listening])

  return (
    <Wrapper>
      <Title>Settings</Title>
      <Input
        type="text"
        placeholder="Your nickname"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button
        listening={listening}
        onClick={() => {
          if (!listening) {
            setShortcut([])
          }
          setListening(!listening)
        }}
      >
        {shortcut.length
          ? shortcut.join(' + ')
          : listening
          ? 'Recording: press a key...'
          : 'Click to set keybinding'}
        {listening && <Stop>X</Stop>}
      </Button>
      <PrimaryButton
        onClick={() => {
          if (listening) {
            setListening(false)
          }
          send('SAVE', { name, shortcut })
        }}
      >
        Save
      </PrimaryButton>
    </Wrapper>
  )
}

export default Settings
