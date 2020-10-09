import { Machine, assign } from 'xstate'

const context = {
  shortcut: JSON.parse(localStorage.getItem('shortcut') || '[]'),
  name: localStorage.getItem('name') || '',
  friends: JSON.parse(localStorage.getItem('friends') || '[]'),
  friendListStatusses: {},
  friendListIds: {},
  live: false,
  socketConnected: false,
  watchId: '', // ID of the friend while watching stream
  videoStream: null,
  streams: {},
  peer: null,
}

const states = {
  settings: {
    on: {
      SAVE: {
        target: 'main',
        actions: ['saveSettings'],
      },
    },
  },
  main: {
    on: {
      SETTINGS: 'settings',
      ADD_FRIEND: {
        actions: ['addFriend'],
      },
      WATCH: {
        target: 'watch',
        actions: ['setWatchId'],
      },
    },
  },
  watch: {
    on: {
      WATCH_ID: {
        action: ['setWatchId'],
      },
      CLOSE_STREAM: {
        target: 'main',
        actions: ['closeStream'],
      },
    },
  },
}

const on = {
  FRIENDLIST_STATUSSES: {
    actions: ['setFriendListStatusses'],
  },
  NAME: {
    actions: ['setName'],
  },
  SOCKET_STATUS: {
    actions: ['setSocketConnected'],
  },
  LIVE: {
    actions: ['setLive'],
  },
  VIDEO_STREAM: {
    actions: ['setVideoStream'],
  },
  ADD_STREAM: {
    actions: ['addStream'],
  },
  STREAM_CONNECTED: {
    actions: ['setStreamConnected'],
  },
  STREAM_DISCONNECTED: {
    target: 'main',
    actions: ['setStreamDisconnected'],
  },
  PEER: {
    actions: ['setPeer'],
  },
}

const config = {
  id: 'ui',
  initial: context.name != '' ? 'main' : 'settings',
  context,
  states,
  on,
}

const actions = new (class {
  saveSettings = assign((ctx, e) => {
    localStorage.setItem('shortcut', JSON.stringify(e.shortcut))
    localStorage.setItem('name', e.name)
    return {
      shortcut: e.shortcut,
      name: e.name,
    }
  })
  addFriend = assign((ctx, e) => {
    let friends = ctx.friends.concat([e.friend])
    localStorage.setItem('friends', JSON.stringify(friends))
    return {
      friends,
    }
  })
  removeFriend = assign((ctx, e) => {
    let friends = ctx.friends.filter((f) => f !== e.friend)
    localStorage.setItem('friends', JSON.stringify(friends))
    return {
      friends,
    }
  })
  setFriendListStatusses = assign((ctx, e) => {
    console.log('statusses', e)
    let ids = e.statusses.reduce((acc, item) => {
      return Object.assign(acc, { [item.name]: item.id })
    }, Object.assign({}, ctx.friendListIds))
    let statusses = e.statusses.reduce((acc, item) => {
      return Object.assign(acc, { [item.name]: item.status })
    }, Object.assign({}, ctx.friendListStatusses))
    return {
      friendListIds: ids,
      friendListStatusses: statusses,
    }
  })
  setName = assign({
    name: (ctx, e) => e.name,
  })
  setSocketConnected = assign((ctx, e) => {
    console.log('socket connected action', e.connected)
    return {
      socketConnected: e.connected,
    }
  })
  setSocketConnected = assign({
    socketConnected: (ctx, e) => e.connected,
  })
  setLive = assign({
    live: (ctx, e) => e.live,
  })
  setWatchId = assign({
    watchId: (ctx, e) => e.id,
  })
  setVideoStream = assign({
    videoStream: (ctx, e) => e.stream,
  })
  addStream = assign({
    streams: (ctx, e) =>
      Object.assign({}, ctx.streams, { [e.id]: { connected: false } }),
  })
  setStreamConnected = assign({
    streams: (ctx, e) =>
      Object.assign({}, ctx.streams, { [e.id]: { connected: true } }),
  })
  setStreamDisconnected = assign({
    streams: (ctx, e) =>
      Object.assign({}, ctx.streams, { [e.id]: { connected: false } }),
  })
  setPeer = assign({
    peer: (ctx, e) => e.peer,
  })
  closeStream = (ctx, e) => {
    console.log(ctx.peer)
    ctx.peer.stopStream()
  }
})()

const uiMachine = Machine(config, {
  actions,
})

export default uiMachine
