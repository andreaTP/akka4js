
const akkajs = require("akkajs")
const fs = require("fs")
const twitterModule = require("node-tweet-stream")

class TwitterActor extends akkajs.Actor {
  constructor() {
    var twitter = new twitterModule(
      JSON.parse(fs.readFileSync(".credentials", "utf8"))
    )
    super(function(msg) {
      twitter.track(msg)
    },
    function() {},  //preStart
    function() {    //postStop
      twitter.untrackAll()
      twitter.abort()
    })
    const self = this

    twitter.on("tweet", function(tweet) {
      self.parent().tell(JSON.stringify(tweet))
    })
  }
}

class WSChannel extends akkajs.Actor {
  constructor(conn) {
    var twitterActor
    super(
      function(msg) { conn.send(msg) },
      function() {
        var self = this
        var twitterActor = self.spawn(new TwitterActor())
        conn.on(`message`, function(msg) {
          twitterActor.tell(msg.utf8Data)
        })
        conn.on(`close`, function() { self.ref.kill() })
      }
    )
  }
}

class WSServerActor extends akkajs.Actor {
  constructor(port) {
    super(function(msg) {})
    const self = this

    var WebSocketServer = require('websocket').server
    var http = require('http')

    var server = http.createServer(function(request, response) {
      response.writeHead(404)
      response.end(`not available`)
    })

    var wsServer = new WebSocketServer({
      "httpServer": server,
      "keepaliveInterval": 1000,
      "keepaliveGracePeriod": 3000,
      "autoAcceptConnections": false
    })

    server.listen(port, function() {
      console.log(`Server is listening on port ${port}`)
    })

    wsServer.on(`request`, function(req) {
      console.log("request received")
      var conn = req.accept(false, req.origin)
      var chan = self.spawn(new WSChannel(conn))
    })
  }
}

var system = akkajs.ActorSystem.create(`TwitterStremingServer`)

system.spawn(new WSServerActor(9002))

//minimal example for twitter integration
/*
system.spawn(new akkajs.Actor(
  function(msg) { console.log(`DEMO ${msg}`)},
  function() { this.spawn(new TwitterActor()).tell("Pizza") } // preStart
))
*/
