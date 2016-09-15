const chai = require('chai'),
      transformer = require('../'),
      spigot = require('stream-spigot'),
      toArray = require('stream-to-array')

chai.should()
chai.use(require('chai-as-promised'))

Array.prototype.transform = function() {
  return toArray(spigot.array({objectMode: true}, this).pipe(transformer.apply(this, arguments)))
}

describe('transform stream', function() {
  beforeEach(function() {
    delete process.env.TRANSFORM_FN
  })

  it('should work without a transform function, validating events when requested', function() {
    return ['bob:login', 'jane:!!', 'jill:login']
    .transform(l => {
      var [user_id, evname] = l.split(':')
      return {
        entype: 'user',
        evname,
        user_id
      }
    })
    .should.eventually.deep.equal([{
      entype: 'user',
      evname: 'login',
      user_id: 'bob'
    }, {
      entype: 'user',
      evname: 'login',
      user_id: 'jill'
    }])
  })

  it('should work without a transform function, not validating events when requested', function() {
    return ['a', 'b', 'c']
      .transform(x => 'You said ' + x, false)
      .should.eventually.deep.equal([
        'You said a',
        'You said b',
        'You said c'
      ])

  })

  it('should work a transform function, passing it the original record and the default event transform', function() {
    global.calls = []
    process.env.TRANSFORM_FN = function(r, e) {
      global.calls.push(Array.prototype.slice.call(arguments))
      e.user_id = 'name:' + e.user_id
      return e
    }.toString()

    return ['bob:login', 'jane:!!', 'jill:login']
    .transform(l => {
      var [user_id, evname] = l.split(':')
      return {
        entype: 'user',
        evname,
        user_id
      }
    })
    .should.eventually.deep.equal([{
      entype: 'user',
      evname: 'login',
      user_id: 'name:bob'
    }, {
      entype: 'user',
      evname: 'login',
      user_id: 'name:jill'
    }]).then(function() {
      global.calls.should.deep.equal([
        ['bob:login', { entype: 'user', evname: 'login', user_id: 'name:bob' }],
        ['jane:!!', { entype: 'user', evname: '!!', user_id: 'name:jane' }],
        ['jill:login', { entype: 'user', evname: 'login', user_id: 'name:jill' }],
      ])
    })
  })

  it('should log how many records it processed', function() {
    var origLog = console.log, lines = []
    console.log = function(l, x) {
      var args = Array.prototype.slice.call(arguments), i = 1
      lines.push(l.replace(/%d/g, () => args[i++]))
      return origLog.apply(console, arguments)
    }

    return ['a', 'b', 'c']
      .transform(x => 'You said ' + x, false)
      .then(function() {
        console.log = origLog
        lines.should.deep.equal([
          'Processed 1 records',
          '\nProcessed 3 records, skipping 0 invalid events'
        ])
      })
  })
})