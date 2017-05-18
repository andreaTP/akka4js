const akkajs = require("akkajs")

var system = akkajs.ActorSystem.create()

class WSActor extends akkajs.Actor {
  constructor(address) {

    var operative = function(ws) {
      return function(msg) {
        if (msg.track != null) ws.send(msg.track)
        else console.log("tweet "+msg)
      }
    }

    super(
      function(msg) { console.log(`NOT READY ${msg}`) },
      function() {
        var self = this

        var ws = new WebSocket(address)

        ws.onopen = function() { self.become(operative(ws)) }
        ws.onmessage = function(event) { self.ref.tell(event.data) }
      }
    )
  }
}

var address = "ws://localhost:9002"
var wsActor = system.spawn(new WSActor(address))

setTimeout(function() {
  console.log("starting")
  wsActor.tell({"track": "pizza"})
}, 2000)
