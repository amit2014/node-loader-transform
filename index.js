const through2 = require('through2'),
  validator = require('appuri-event-validator')

function asArray(data) {
  if (Array.isArray(data)) {
    return data
  } else if (data) {
    return [data]
  }
  return []
}

module.exports = function (loaderTransform, userTransform, validateLoaderEvents) {
  var recordCount = 0, invalidEvents = 0
  const transformFn = userTransform && new Function(
      'exports', 'require', 'module',
      '__filename', '__dirname',
      `return ${userTransform}`
    )(exports, require, module, __filename, __dirname)

  return through2.obj(function (chunk, enc, cb) {
    if (chunk == null) return

    if ((recordCount++) % 10000 === 0) {
      console.log('Processed %d records', recordCount)
    }

    var loaderEventValidator = (le) => validateLoaderEvents !== false ? validator.isValid(le) : true

    asArray(loaderTransform(chunk)).forEach(le => {
      if (transformFn) {
        var transformed = asArray(transformFn(chunk, le))
        var validEvents = transformed.filter(validator.isValid)
        validEvents.forEach(e => this.push(e))
        invalidEvents += (transformed.length - validEvents.length)
      } else {
        if(loaderEventValidator(le)) {
          this.push(le)
        } else {
          invalidEvents++
        }
      }
    })

    cb()
  },
    function (cb) {
      console.log('\nProcessed %d records, skipping %d invalid events', recordCount, invalidEvents)
      cb()
    })
}