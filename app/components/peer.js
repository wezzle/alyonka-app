import React, { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { desktopCapturer } from 'electron'
import Socket from '../utils/socket'

import { ReactComponent as StopIcon } from '../assets/icons/stop.svg'

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const VideoContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
`

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: ${(props) => (props.hide ? 'none' : 'block')};
`

const Center = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`

const Close = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: #1d242e;
  border-radius: 30px;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  svg path {
    fill: white;
    transition: all 0.5s ease-out;
  }

  &:hover {
    svg path {
      fill: rgba(255, 255, 255, 0.7);
    }
  }
`

const Peer = ({ state, send }) => {
  const { context } = state
  const { videoStream, streams, watchId, peer } = context

  console.log('videoStream', videoStream)

  const videoEl = useRef(null)

  // Connect stream to video element
  useEffect(() => {
    if (videoEl && videoEl.current && videoStream) {
      console.log('setting video stream on element')
      let video = videoEl.current
      video.srcObject = videoStream
      video.play()
    }
  }, [videoStream, videoEl])

  // Set up Socket
  useEffect(() => {
    if (!watchId) return
    console.log('CONNECTING', Socket.id, watchId)
    fetch('https:///alyonka-signaling.onrender.com/api/connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initiator: Socket.id,
        receiver: watchId,
      }),
    })
  }, [watchId])

  return (
    <>
      <VideoContainer>
        {streams[watchId] && !streams[watchId].connected && (
          <Center>
            <span>Connecting...</span>
          </Center>
        )}
        <Video ref={videoEl} hide={!videoStream} />
        <Close onClick={() => send('CLOSE_STREAM')}>
          <StopIcon width={25} height={25} />
        </Close>
      </VideoContainer>
    </>
  )
}

export default Peer
