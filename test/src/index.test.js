const assert = require('chai').assert

describe('/src/index.js', () => {
  it('should have an orm object', () => {
    const { orm } = require('../../dist')
    assert.isOk(orm)
  })
  it('should have an ormQuery object', () => {
    const { ormQuery } = require('../../dist')
    assert.isOk(ormQuery)
  })
  it('should have an datastore object', () => {
    const { datastore } = require('../../dist')
    assert.isOk(datastore)
  })
})
