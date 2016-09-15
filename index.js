const through2 = require('through2'),
      validator = require('appuri-event-validator')

module.exports = function(loaderTransform, validate) {
  let recordCount = 0, invalidEvents = 0
  const transformFn = process.env.TRANSFORM_FN && new Function(`return (${process.env.TRANSFORM_FN}).apply(this, arguments)`)

  return through2.obj(function(chunk, enc, cb) {
    if (chunk.error) {
      return cb()
    }

    if ((recordCount++) % 10000 === 0) {
      console.log('Processed %d records', recordCount)
    }

    var defaultEvent = loaderTransform(chunk)

    if (transformFn) {
      let transformed = transformFn(chunk, defaultEvent)

      // transform functions may return 0, 1, or many events
      if (transformed) {
        if (Array.isArray(transformed)) {
          var validEvents = transformed.filter(validator.isValid)
          validEvents.forEach(e => this.push(e))
          invalidEvents += (transformed.length - validEvents.length)
        } else if (validator.isValid(transformed)) {
          this.push(transformed)
        } else {
          invalidEvents++
        }
      }
    } else if (defaultEvent && (validate === false || validator.isValid(defaultEvent))) {
      this.push(defaultEvent)
    }

    cb()
  },
  function(cb) {
    console.log('\nProcessed %d records, skipping %d invalid events', recordCount, invalidEvents)
    cb()
  })
}