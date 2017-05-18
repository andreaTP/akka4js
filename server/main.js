
const akkajs = require('akkajs')
const fs = require('fs')
const twitterModule = require('node-tweet-stream')

const credentials =
  JSON.parse(fs.readFileSync(`.credentials`, `utf8`))

class TwitterActor extends akkajs.Actor {
  constructor() {
    var twitter = new twitterModule(credentials)
    super(
      function(msg) {
        console.log(`going to track ${msg}`)
        twitter.track(msg)
      },
      function() {  //preStart
        const self = this

        twitter.on(`tweet`, function(tweet) {
          self.parent().tell(JSON.stringify(tweet))
        })
      },
      function() {    //postStop
        twitter.untrackAll()
        twitter.abort()
      }
    )
  }
}

class WSChannel extends akkajs.Actor {
  constructor(conn) {
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
    super(
      function(msg) {},
      function() {
        const self = this

        var WebSocketServer = require(`websocket`).server
        var http = require(`http`)

        var server = http.createServer(function(request, response) {
          response.writeHead(404)
          response.end(`not available`)
        })

        var wsServer = new WebSocketServer({
          httpServer: server,
          keepaliveInterval: 1000,
          keepaliveGracePeriod: 3000,
          autoAcceptConnections: false
        })

        server.listen(port, function() {
          console.log(`Server is listening on port ${port}`)
        })

        wsServer.on(`request`, function(req) {
          self.spawn(new WSChannel(req.accept(false, req.origin)))
        })
      }
    )
  }
}

var system = akkajs.ActorSystem.create(`TwitterStremingServer`)

system.spawn(new WSServerActor(9002))

//minimal example for twitter integration
/*
system.spawn(new akkajs.Actor(
  function(msg) { console.log(`DEMO ${msg}`)},
  function() { this.spawn(new TwitterActor()).tell(`Pizza`) } // preStart
))
*/
