This package implements the edit distance algorithm for ordered, labeled trees described by Zhang and Shasha in 1989.

Tim Henderson's [Python implementation](https://github.com/timtadh/zhang-shasha), with Erick Fonseca's approach to concatenating edit operations, directly inspired this JavaScript implementation.

# Usage

The package exports two functions, `distance` and `mapping`.  `distance` returns the edit distance from one tree to another.  `mapping` returns an array of edit operations for transforming one tree into another.

```javascript
var zs = require('zhang-shasha')
var assert = require('assert')

var a = {
  label: 'a',
  children: [
    {label: 'b', children: []},
    {label: 'c', children: []}
  ]
}

var b = {
  label: 'a',
  children: [
    {label: 'b', children: []}
  ]
}

function children (node) {
  return node.children
}

function insertCost () { return 1 }
function removeCost () { return 1 }
function updateCost (from, to) {
  return from.label === to.label ? 0 : 1
}
```

Note that you can use whatever data structure you choose or your tree, as long as you provide functions to list children and define costs for each tree edit operation.

```javascript
assert.equal(
  zs.distance(a, b, children, insertCost, removeCost, updateCost),
  1
)

assert.deepEqual(
  zs.mapping(a, b, children, insertCost, removeCost, updateCost),
  [
    {
      type: 'match',
      t1: a,
      t2: b
    },
    {
      type: 'remove',
      t1: a.children[1],
      t2: null
    },
    {
      type: 'match',
      t1: a.children[0],
      t2: b.children[0]
    }
  ],
)
```

# Licensing

This package is to free to use in open source under the terms of the [License Zero Reciprocal Public License](./LICENSE).

Licenses for use in closed and proprietary software are available [via licensezero.com](https://licensezero.com/projects/bede7f97-c83f-411c-8bd0-e4bc66ee1370).
