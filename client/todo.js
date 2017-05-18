const akkajs = require('akkajs')
const h = require('virtual-dom/h')
const akkajs_dom = require('./akkajs-dom.js')

var system = akkajs.ActorSystem.create()

var elemActor = function(text) {
  return new akkajs_dom.DomActor(
    function(self) {
      return h(`li`, [
        text,
        h(`button`, { onclick: ev => { self.ref.kill() } }, `X`)
      ])
    },
    function() {},
    function(self, msg) {}
  )
}

var listActor = system.spawn(
  new akkajs_dom.DomActor(
    function() { return h(`ul`, `todo`) },
    function() {},
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
