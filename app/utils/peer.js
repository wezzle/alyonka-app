import { desktopCapturer } from 'electron'
import Socket from './socket'
import SimplePeer from 'simple-peer'
import { Types } from '../utils/proto'

const Peer = (service, send) =>
  new (class {
    constructor() {
      this.isStreamer = false
      service.onTransition((state) => {
        this.state = state
        if (!this.state.context.live && this.isStreamer) {
          this.stopStream()
        }
      })

      Socket.on('webrtc_sdp_offer', this.onOffer)
      Socket.on('webrtc_sdp_answer', this.onAnswer)
      Socket.on('webrtc_ice_candidate', this.onCandidate)
      Socket.on('webrtc_renegotiate', this.onRenegotiate)

      Socket.on('request', this.startStreamer)
      Socket.on('ready', this.startViewer)
    }

    stopStream = () => {
      console.log('destroying peer')
      this.peer && this.peer.destroy()
    }

    startStreamer = async (signal) => {
      console.log('starting streamer, with target: ', signal.from)

      if (!this.state.context.live) {
        console.log('ignoring request, not live')
        return
      }

      this.isStreamer = true

      send('ADD_STREAM', { id: signal.from })
      let stream
      if (this.state.context.stream) {
        stream = this.state.context.stream
      } else {
        const sources = await desktopCapturer.getSources({
          types: ['window', 'screen'],
        })
        const sourceId = sources.filter((s) => s.name === 'Entire Screen')[0].id
        console.log('source ID: ', sourceId)
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              minWidth: 1920,
              maxWidth: 1920,
              minHeight: 1080,
              maxHeight: 1080,
            },
          },
        })

        send('VIDEO_STREAM', { stream })
      }

      // videoEl.current.srcObject = stream
      // videoEl.current.onloadedmetadata = (e) => videoEl.current.play()

      let options = {
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
          ],
        },
        answerOptions: {
          offerToReceiveAudio: false,
          offerToReceiveVideo: false,
        },
      }
      this.peer = new SimplePeer(options)
      this.bindPeerEvents(signal.from)

      // Notify viewer of ready
      Socket.sendSignal({
        type: Types.values.READY,
        from: Socket.id,
        to: signal.from,
      })
    }

    startViewer = async (signal) => {
      console.log('starting initiator, with target: ', signal.from)

      send('WATCH_ID', { id: signal.from })
      send('ADD_STREAM', { id: signal.from })

      let options = {
        initiator: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
          ],
        },
        offerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        },
      }
      this.peer = new SimplePeer(options)

      this.bindPeerEvents(signal.from)
    }

    bindPeerEvents = (targetId) => {
      this.peer.on('error', (err) => {
        console.log('PEER ERROR', err)
      })
      this.peer.on('signal', async (data) => {
        console.log('THIS.PEER SIGNAL', data)
        if (data.type && data.sdp) {
          let type =
            data.type === 'offer'
              ? Types.values.WEBRTC_SDP_OFFER
              : Types.values.WEBRTC_SDP_ANSWER
          let signal = {
            type,
            from: Socket.id,
            to: targetId,
            sdp: data.sdp,
          }
          console.log('sending sdp offer or answer')
          await Socket.sendSignal(signal)
        }
        if (data.candidate) {
          let signal = {
            type: Types.values.WEBRTC_ICE_CANDIDATE,
            from: Socket.id,
            to: targetId,
            ice: data.candidate,
          }
          console.log('sending ice', signal)
          await Socket.sendSignal(signal)
        }
        if (data.renegotiate) {
          let signal = {
            type: Types.values.WEBRTC_RENEGOTIATE,
            from: Socket.id,
            to: targetId,
          }
        }
      })
      this.peer.on('connect', () => {
        send('STREAM_CONNECTED', { id: targetId })
        console.log('PEER CONNECTED')
      })
      this.peer.on('close', () => {
        send('STREAM_DISCONNECTED', { id: targetId })
        this.stopStream()
        console.log('PEER DISCONNECTED')
      })
      this.peer.on('data', (data) => {
        console.log('PEER DATA', data)
      })
      this.peer.on('stream', (stream) => {
        console.log('RECEIVED STREAM', stream)
        send('VIDEO_STREAM', { stream })
      })
    }

    onOffer = (offer) => {
      if (!this.peer) return
      this.peer.signal(offer)
    }

    onAnswer = (answer) => {
      if (!this.peer) return
      console.log('IMPORT ANSWER', answer)
      this.peer.signal(answer)
    }

    onCandidate = (candidate) => {
      if (!this.peer) return
      this.peer.signal(candidate)
    }

    onRenegotiate = (renegotiate) => {
      if (!this.peer) return
      this.peer.signal(renegotiate)
    }

    setSocketId = () => {
      if (!this.peer) return
      this.setId(Socket.id)
    }
  })()

export default Peer
