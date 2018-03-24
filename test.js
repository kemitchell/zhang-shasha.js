var deepEqual = require('deep-equal')
var suite = require('tree-edit-distance-tests')
var tape = require('tape')
var zs = require('./')

tape('distance', function (t) {
  suite.tests.forEach(function (test) {
    t.test(test.comment, function (t) {
      t.equal(
        zs.distance(
          test.t1, test.t2,
          children, insert, remove, update
        ),
        test.distance
      )
      t.end()
    })
  })
  t.end()
})

tape('mappings', function (t) {
  suite.tests.forEach(function (test) {
    t.test(test.comment, function (t) {
      var mapping = zs.mapping(
        test.t1, test.t2,
        children, insert, remove, update
      ).map(function (element) {
        return {
          type: element.type,
          t1: element.t1 ? element.t1.label : null,
          t2: element.t2 ? element.t2.label : null
        }
      })
      t.assert(
        test.mappings.some(function (validMapping) {
          return deepEqual(mapping, validMapping)
        })
      )
      t.end()
    })
  })
  t.end()
})

function children (node) { return node.children }

function insert () { return suite.costs.insert }

function remove () { return suite.costs.remove }

function update (from, to) {
  return from.label === to.label
    ? suite.costs.match
    : suite.costs.update
}
