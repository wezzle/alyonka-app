import React, { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import routes from '../constants/routes'
import styles from './Home.css'
import { desktopCapturer } from 'electron'
import styled from 'styled-components'
import Peer from './Peer'
import Socket from '../utils/socket'

const SourceWrapper = styled.div`
  display: flex;
  justify-content: center;
`

const Source = styled.button`
  background: white;
  border-radius: 8px;
  padding: 10px;
  margin: 20px;
  color: #000;
  display: flex;
  justify-content: center;
  flex-direction: column;
  border: none;
  cursor: pointer;

  span {
    max-width: 150px;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 100%;
    display: block;
  }
`

const Video = styled.video`
  max-width: 100%;
`

const Home = (props) => {
  const [sources, setSources] = useState([])
  const [remote, setRemote] = useState('')
  const videoEl = useRef(null)

  const loadSources = useCallback(async () => {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
    })

    console.log(sources)
    setSources(sources)
  }, [])

  const getUserMedia = useCallback(async (source) => {
    console.log('stream id', source.id)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: 'screen:362:0',
          minWidth: 1920,
          maxWidth: 1920,
          minHeight: 1080,
          maxHeight: 1080,
        },
      },
    })

    console.log(stream)

    videoEl.current.srcObject = stream
    videoEl.current.onloadedmetadata = (e) => videoEl.current.play()
  }, [])

  const onChange = (e) => {
    setRemote(e.target.value)
  }

  const connect = async () => {
    await fetch('http://signaling.localhost:1324/api/connection', {
      method: 'POST',
      body: JSON.stringify({
        initiator: Socket.id,
        receiver: remote,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    console.log('request sent')
  }

  return (
    <div>
      <h2>Home</h2>
      <input type="text" onChange={onChange} />
      <button onClick={connect}>Connect</button>

      <h3>Peer</h3>
      <Peer />

      <SourceWrapper>
        {sources.map((source) => (
          <Source onClick={() => getUserMedia(source)} key={source.id}>
            <span>{source.name}</span>
            <img src={source.thumbnail.toDataURL()} />
          </Source>
        ))}
      </SourceWrapper>

      <h3>Video</h3>
      <button onClick={loadSources}>Load sources</button>
      <Video ref={videoEl} />
    </div>
  )
}

export default Home
