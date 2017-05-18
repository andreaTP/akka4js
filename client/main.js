const akkajs = require('akkajs')
const h = require('virtual-dom/h')
const akkajs_dom = require('./akkajs-dom.js')

class Track {
  constructor(topic) { this.topic = topic }
}
class Tweet {
  constructor(from, text) {
    this.from = from
    this.text = text
  }
}

var address = `ws://localhost:9002`

class WSActor extends akkajs.Actor {
  constructor(address) {

    var operative = function(self, ws) {
      return function(msg) {
        if (msg instanceof Track)
          ws.send(msg.topic)
        else {
          var json = JSON.parse(msg)
          self.parent().tell(new Tweet(json.user.name, json.text))
        }
      }
    }

    super(
      function(msg) { console.log(`NOT READY ${msg}`) },
      function() {
        var self = this

        var ws = new WebSocket(address)

        ws.onopen = function() { self.become(operative(self, ws)) }
        ws.onmessage = function(event) { self.ref.tell(event.data) }
      }
    )
  }
}

class TrackActor extends akkajs_dom.DomActor {
  constructor() {
    super(
      function(self) {
        return h(`div`, [
          h(`input`, { id: `track`, placeholder: `what to track ...` }),
          h(`button`, {
            onclick: ev => {
              self.parent().tell(new Track(document.getElementById("track").value))
            }
          }, `TRACK`)
        ])
      },
      function() {},
      function() {}
    )
  }
}

class LastMsgActor extends akkajs_dom.DomActor {
  constructor() {
    super(
      function(self, tweet) {
        if (tweet == null) return h(`div`)
        else return h(`div`, [
          h(`h3`, tweet.from),
          h(`p`, tweet.text)
        ])
      },
      function() {},
      function() {}
    )
  }
}

class UIActor extends akkajs_dom.DomActor {
  constructor() {
    var wsActor, trackActor, lmActor
    super(
      function() { return h(`div`) },
      function(self) {
        wsActor = self.spawn(new WSActor(address))
        trackActor = self.spawn(new TrackActor())
        lmActor = self.spawn(new LastMsgActor())
      },
      function (self, msg) {
        if (msg instanceof Track)
          wsActor.tell(msg)
        else if (msg instanceof Tweet)
          lmActor.tell(new akkajs_dom.Update(msg))
        else
          console.warning(`unhandled ${msg}`)
      },
      document.body
    )
  }
}

var system = akkajs.ActorSystem.create()

var uiActor = system.spawn(new UIActor)

//setTimeout( function() {
//  uiActor.tell(new Track(`pizza`))
//}, 2000)
//var wsActor = system.spawn(new WSActor(address))

//setTimeout(function() {
//  console.log(`starting`)
//  wsActor.tell(new Track(`pizza`))
//}, 2000)
