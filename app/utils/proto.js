export const Types = (() => {
  let values = {
    WEBRTC_SDP_OFFER: 0,
    WEBRTC_SDP_ANSWER: 1,
    WEBRTC_ICE_CANDIDATE: 2,
    WEBRTC_RENEGOTIATE: 3,
    REQUEST: 4,
    READY: 5,
    DISCONNECT: 6,
    WELCOME: 7,
    ERROR: 8,
  }
  let valuesById = Object.keys(values).reduce(
    (acc, k) => Object.assign(acc, { [values[k]]: k }),
    {}
  )
  return {
    values,
    valuesById,
  }
})()
