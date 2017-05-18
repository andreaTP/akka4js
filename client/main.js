const akkajs = require("akkajs")

var system = akkajs.ActorSystem.create()

//messages matched with isinstaceof and not json...

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
//var wsActor = system.spawn(new WSActor(address))

//setTimeout(function() {
//  console.log("starting")
//  wsActor.tell({"track": "pizza"})
//}, 2000)

/*
update message:
{
  "update": <newValue>
}

{"getparent": true}
*/
var h = require('virtual-dom/h')
var diff = require('virtual-dom/diff')
var patch = require('virtual-dom/patch')
var createElement = require('virtual-dom/create-element')

class DomActor extends akkajs.Actor {
  constructor(renderFn, operative, parentNode) {
    var tree = renderFn()
    var node = createElement(tree)
    var parent

    var assignParent = function(p) {
      parent = p
      parent.appendChild(node)
    }

    var update = function(newValue) {
      var newTree = renderFn(newValue)
      var patches = diff(tree, newTree)
      node = patch(node, patches)
      tree = newTree
    }

    super(
      function (msg) {
        console.log("message "+msg)
        if (msg.update != null)
          update(msg.update)
        else if (msg.getparent != null)
          this.sender().tell({ "parent": node })
        else if (msg.parent != null)
          assignParent(msg.parent)
        else operative(this, msg)
      },
      function() {
        if (parentNode != null)
          assignParent(parentNode)
        else this.parent().tell({"getparent": true})
      },
      function() {
        try {
          parentNode.removeChild(node)
        } catch (e) {}
      }
    )
  }
}
/*
var uiActor = system.spawn(new DomActor(
  function(value) {
    var str = `Hello world`
    if (value != null)
      str += ` ${value}`

    return h('h1', str)
  },
  function(self, msg) { console.log("free message "+msg) },
  document.getElementById("root")
))

var count = 0

setInterval(function() {
  uiActor.tell({"update": `${count}`})
  count += 1
}, 2000)
*/
var elemActor = function(text) {
  return new DomActor(
    function() { return h('li', text) },
    function(self, msg) {}
  )
}

var listActor = system.spawn(new DomActor(
  function() { return h('ul', `todo`) },
  function(self, msg) {
    console.log("adding element "+msg)
    self.spawn(elemActor(`elem ${msg}`))
  },
  document.getElementById("root")
))

var count = 0

setInterval(function() {
  listActor.tell(`${count}`)
  count += 1
}, 2000)
