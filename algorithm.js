/* eslint camelcase: "off" */
// #ifdef MAPPING
var INSERT = 'insert'
var MATCH = 'match'
var REMOVE = 'remove'
var UPDATE = 'update'
// #endif

module.exports = function (rootOfT1, rootOfT2, childrenOf, insertCost, removeCost, updateCost) {
  // Paper: "Preprocessing"
  var T1 = preprocess(rootOfT1, childrenOf)
  var T2 = preprocess(rootOfT2, childrenOf)

  var orderOfT1 = T1.nodes.length
  var LR_keyroots1 = T1.keyroots
  var T1l = T1.l
  var T1nodes = T1.nodes

  var orderOfT2 = T2.nodes.length
  var LR_keyroots2 = T2.keyroots
  var T2l = T2.l
  var T2nodes = T2.nodes

  // Initialize Matrices
  var treedist = initializeMatrix(orderOfT1, orderOfT2)
// #ifdef MAPPING
  var operations = initializeMatrix(orderOfT1, orderOfT2, true)
// #endif

  // Paper: "Main loop"
  for (var iprime = 0; iprime < LR_keyroots1.length; iprime++) {
    for (var jprime = 0; jprime < LR_keyroots2.length; jprime++) {
      compute_treedist(LR_keyroots1[iprime], LR_keyroots2[jprime])
    }
  }

// #ifdef MAPPING
  return operations[orderOfT1 - 1][orderOfT2 - 1].reverse()
// #else
  return treedist[orderOfT1 - 1][orderOfT2 - 1]
// #endif

  // Paper: "The computation of treedist(i, j)."
  function compute_treedist (i, j) {
    var iOffset = T1l[i] - 1
    var iRange = i - T1l[i] + 2
    var jOffset = T2l[j] - 1
    var jRange = j - T2l[j] + 2
    var forestDistances = initializeMatrix(iRange, jRange)
// #ifdef MAPPING
    var forestOperations = initializeMatrix(iRange, jRange, true)
// #endif
    var node
    var i1, j1

    for (i1 = 1; i1 < iRange; i1++) {
      node = T1nodes[i1 + iOffset]
      forestDistances[i1][0] = (
        forestDistances[i1 - 1][0] +
        removeCost(node)
      )
// #ifdef MAPPING
      forestOperations[i1][0] = (
        forestOperations[i1 - 1][0].concat({
          type: REMOVE, t1: node, t2: null
        })
      )
// #endif
    }

    for (j1 = 1; j1 < jRange; j1++) {
      node = T2nodes[j1 + jOffset]
      forestDistances[0][j1] = (
        forestDistances[0][j1 - 1] +
        insertCost(node)
      )
// #ifdef MAPPING
      forestOperations[0][j1] = (
        forestOperations[0][j1 - 1].concat({
          type: INSERT, t1: null, t2: node
        })
      )
// #endif
    }

    for (i1 = 1; i1 < iRange; i1++) {
      for (j1 = 1; j1 < jRange; j1++) {
        var T1node = T1nodes[i1 + iOffset]
        var T2node = T2nodes[j1 + jOffset]
        var remove, insert, update, min
        // Is i1 an ancestor of i, and j1 an ancestor of j?
        if (T1l[i] === T1l[i1 + iOffset] && T2l[j] === T2l[j1 + jOffset]) {
          remove = forestDistances[i1 - 1][j1] + removeCost(T1node)
          insert = forestDistances[i1][j1 - 1] + insertCost(T2node)
          update = (
            forestDistances[i1 - 1][j1 - 1] +
            updateCost(T1node, T2node)
          )
          min = Math.min(remove, insert, update)
          forestDistances[i1][j1] = min
// #ifdef MAPPING
          if (min === remove) {
            forestOperations[i1][j1] = forestOperations[i1 - 1][j1]
              .concat({type: REMOVE, t1: T1node, t2: null})
          } else if (min === insert) {
            forestOperations[i1][j1] = forestOperations[i1][j1 - 1]
              .concat({type: INSERT, t1: null, t2: T2node})
          } else {
            var type = forestDistances[i1][j1] === forestDistances[i1 - 1][j1 - 1]
              ? MATCH : UPDATE
            forestOperations[i1][j1] = forestOperations[i1 - 1][j1 - 1]
              .concat({type: type, t1: T1node, t2: T2node})
          }
          operations[i1 + iOffset][j1 + jOffset] = forestOperations[i1][j1]
// #endif
          treedist[i1 + iOffset][j1 + jOffset] = forestDistances[i1][j1]
        } else {
          remove = forestDistances[i1 - 1][j1] + removeCost(T1node)
          insert = forestDistances[i1][j1 - 1] + insertCost(T2node)
          var p = T1l[i1 + iOffset] - 1 - iOffset
          var q = T2l[j1 + jOffset] - 1 - jOffset
          update = (
            forestDistances[p][q] +
            treedist[i1 + iOffset][j1 + jOffset]
          )
          min = Math.min(remove, insert, update)
          forestDistances[i1][j1] = min
// #ifdef MAPPING
          if (min === remove) {
            forestOperations[i1][j1] = forestOperations[i1 - 1][j1]
              .concat({type: REMOVE, t1: T1node, t2: null})
          } else if (min === insert) {
            forestOperations[i1][j1] = forestOperations[i1][j1 - 1]
              .concat({type: INSERT, t1: null, t2: T2node})
          } else {
            forestOperations[i1][j1] = forestOperations[p][q]
              .concat(operations[i1 + iOffset][j1 + jOffset])
          }
// #endif
        }
      }
    }
  }
}

function preprocess (root, childrenOf) {
  var returned = {nodes: [], l: [], keyroots: []}
  postOrderWalk(root, childrenOf, function (data) {
    var index = data.index
    var node = data.node
    var firstChild = data.firstChild
    var nodesLength = returned.nodes.length
    returned.nodes.push(node)
    returned.l.push(
      firstChild
        ? returned.l[returned.nodes.indexOf(firstChild)]
        : nodesLength
    )
    if (index !== 0) returned.keyroots.push(nodesLength)
  })
  returned.keyroots.sort()
  return returned
}

function postOrderWalk (root, childrenOf, iterator) {
  var from = []
  var to = []
  from.push({index: null, node: root})
  while (from.length !== 0) {
    var popped = from.pop()
    var index = popped.index
    var node = popped.node
    var children = childrenOf(node) || []
    var firstChild = children[0] || null
    to.push({index: index, node: node, firstChild: firstChild})
    for (var childIndex = 0; childIndex < children.length; childIndex++) {
      from.push({index: childIndex, node: children[childIndex]})
    }
  }
  for (var i = to.length - 1; i >= 0; i--) {
    iterator(to[i])
  }
}

// #ifdef MAPPING
function initializeMatrix (width, height, arrays) {
  var returned = new Array(width)
  for (var x = 0; x < width; x++) {
    returned[x] = new Array(height)
    for (var y = 0; y < height; y++) {
      returned[x][y] = arrays ? [] : 0
    }
  }
  return returned
}
// #else
function initializeMatrix (width, height, arrays) {
  var returned = new Array(width)
  for (var x = 0; x < width; x++) {
    returned[x] = new Array(height).fill(0)
  }
  return returned
}
// #endif
