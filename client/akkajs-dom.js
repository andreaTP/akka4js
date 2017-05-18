const akkajs = require('akkajs')
const diff = require('virtual-dom/diff')
const patch = require('virtual-dom/patch')
const createElement = require('virtual-dom/create-element')

class Update { constructor(value) { this.value = value } }
class GetParentNode { constructor() {} }
class ParentNode { constructor(node) { this.node = node } }

class DomActor extends akkajs.Actor {
  constructor(renderFn, preStart, operative, parentNode) {
    var tree, node, parent

    var assignParent = function(self, p) {
      parent = p
      parent.appendChild(node)

      preStart(self)
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

        if (msg instanceof Update)
          update(self, msg.value)
        else if (msg instanceof GetParentNode)
          self.sender().tell(new ParentNode(node))
        else if (msg instanceof ParentNode)
          assignParent(self, msg.node)
        else
          operative(self, msg)
      },
      function() {
        var self = this

        tree = renderFn(self)
        node = createElement(tree)

        if (parentNode != null)
          assignParent(self, parentNode)
        else
          self.parent().tell(new GetParentNode())
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

module.exports = {
  Update: Update,
  DomActor: DomActor
}
