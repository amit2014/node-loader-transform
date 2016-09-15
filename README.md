## Loader Transform module

Handles some logging boilerplate around `through2` and the contract with a user's transform function. It will log how many records are processed every 10,000 records and at the end of a stream.

### Default Loader Transform `loaderTransform`

A function that will take in a record (a chunk in a stream, e.g. a line in a CSV file, a document in a Mongo collection, a row from a database query) and optionally return an event. This is validated by default.

### User-Defined Transform `process.env.TRANSFORM_FN`

An optional function that takes in the record and the event from `loaderTransform` that returns 0, 1, or many appuri events (null, undefined, object, or an array of objects). These are validated, and valid events are passed along, with invalid events simply being ignored.