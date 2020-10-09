import EventEmitter from 'eventemitter3'
import { Types } from './proto'

class socket extends EventEmitter {
  constructor() {
    super()
    ;(async () => {
      this.ws = new WebSocket('wss://alyonka-signaling.onrender.com/ws')
      this.ws.binaryType = 'arraybuffer'
      this.ws.onopen = () => this.onOpen()
      this.ws.onclose = () => this.onClose()
      this.ws.onmessage = (...args) => this.onMessage(...args)

      this.encoder = new TextEncoder()
      this.decoder = new TextDecoder()

      this.id = ''
      this.name = ''

      this.connected = new Promise((resolve) => {
        this.onConnect = resolve
      })
    })()
  }

  onOpen() {
    // Resolve connect promise
    this.onConnect()
  }

  onClose() {
    this.emit('close')
    console.log('socket closed')
  }

  async onMessage(message) {
    const envelop = JSON.parse(message.data)

    switch (envelop.event) {
      case 'signal':
        this.handleSignal(envelop.data)
        break
      case 'status':
        this.handleStatus(envelop.data)
        break
      case 'updated_name':
        this.name = envelop.data.name
        this.handleUpdatedName(envelop.data)
        break
    }
  }

  handleStatus(statusses) {
    this.emit('statusses', statusses)
  }

  handleUpdatedName(name) {
    this.emit('updated_name', name)
  }

  handleSignal(signal) {
    console.log(
      'received signal:',
      signal,
      'with type: ',
      Types.valuesById[signal.type]
    )

    // Default event to be emitted
    let event = signal

    // Overwrites in event structure
    if (signal.type === Types.values.WEBRTC_SDP_OFFER) {
      event = {
        type: 'offer',
        sdp: signal.sdp,
      }
    }
    if (signal.type === Types.values.WEBRTC_SDP_ANSWER) {
      event = {
        type: 'answer',
        sdp: signal.sdp,
      }
    }
    if (signal.type === Types.values.WEBRTC_ICE_CANDIDATE) {
      event = {
        candidate: signal.ice,
      }
    }
    if (signal.type === Types.values.WEBRTC_RENEGOTIATE) {
      event = {
        renegotiate: true,
      }
    }
    if (signal.type === Types.values.WELCOME) {
      this.id = signal.to
      console.log('received my id: ', this.id)
    }

    // Emit event on "Type" channel
    console.log('EMITTING: ', Types.valuesById[signal.type].toLocaleLowerCase())
    this.emit(Types.valuesById[signal.type].toLocaleLowerCase(), event)
  }

  async sendSignal(signal) {
    if (signal.data && signal.data.sdp) {
      signal.data.sdp = this.encoder.encode(signal.data.sdp)
    }
    const envelop = {
      event: 'signal',
      data: signal,
    }
    this.sendMessage(envelop)
  }

  async sendName(name) {
    if (this.name !== name) {
      this.sendMessage({
        event: 'name',
        data: {
          name,
        },
      })
      this.name = name
    }
  }

  async sendMessage(envelop) {
    this.ws.send(JSON.stringify(envelop))
  }
}

export default new socket()
