const akkajs = require('akkajs')
const h = require('virtual-dom/h')
const diff = require('virtual-dom/diff')
const patch = require('virtual-dom/patch')
const createElement = require('virtual-dom/create-element')

var system = akkajs.ActorSystem.create()

class Track {
  constructor(topic) { this.topic = topic }
}

class WSActor extends akkajs.Actor {
  constructor(address) {

    var operative = function(ws) {
      return function(msg) {
        if (msg instanceof Track) ws.send(msg.topic)
        else console.log(`tweet `+msg)
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

var address = `ws://localhost:9002`
var wsActor = system.spawn(new WSActor(address))

setTimeout(function() {
  console.log(`starting`)
  wsActor.tell(new Track(`pizza`))
}, 2000)

/*
update message:
{
  `update`: <newValue>
}

{`getparent`: true}
*/

class UpdateDom { constructor(value) { this.value = value } }
class GetParentNode { constructor() {} }
class ParentNode { constructor(node) { this.node = node } }

class DomActor extends akkajs.Actor {
  constructor(renderFn, operative, parentNode) {
    var tree
    var node
    var parent

    var assignParent = function(p) {
      parent = p
      parent.appendChild(node)
    }

    var update = function(self, newValue) {
      var newTree = renderFn(self, newValue)
      var patches = diff(tree, newTree)
      node = patch(node, patches)
      tree = newTree
    }

    super(
      function (msg) {
        var self = this

        if (msg instanceof UpdateDom)
          update(self, msg.value)
        else if (msg instanceof GetParentNode)
          this.sender().tell(new ParentNode(node))
        else if (msg instanceof ParentNode)
          assignParent(msg.node)
        else
          operative(this, msg)
      },
      function() {
        var self = this

        tree = renderFn(self)
        node = createElement(tree)

        if (parentNode != null)
          assignParent(parentNode)
        else this.parent().tell(new GetParentNode())
      },
      function() {
        try {
          parent.removeChild(node)
          node.remove()
        } catch (e) {}
      }
    )
  }
}
/*
var uiActor = system.spawn(new DomActor(
  function(self, value) {
    var str = `Hello world`
    if (value != null)
      str += ` ${value}`

    return h(`h1`, str)
  },
  function(self, msg) { console.log(`free message `+msg) },
  document.getElementById(`root`)
))

var count = 0

setInterval(function() {
  uiActor.tell({`update`: `${count}`})
  count += 1
}, 2000)
*/
var elemActor = function(text) {
  return new DomActor(
    function(self) {
      return h(`li`, [
        text,
        h(`button`, { onclick: ev => { self.ref.kill() } }, `X`)
      ])
    },
    function(self, msg) {}
  )
}

var listActor = system.spawn(new DomActor(
  function() { return h(`ul`, `todo`) },
  function(self, msg) {
    self.spawn(elemActor(`elem ${msg}`))
  },
  document.getElementById(`root`)
))

var count = 0

var interval = setInterval(function() {
  listActor.tell(`${count}`)
  count += 1
  if (count > 10)
    clearInterval(interval)
}, 2000)
