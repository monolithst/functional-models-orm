const assert = require('chai').assert
const index = require('../../src')

describe('/src/index.js', () => {
  it('should have an orm object', () => {
    const { orm } = require('../../src')
    assert.isOk(orm)
  })
  it('should have an ormQuery object', () => {
    const { ormQuery } = require('../../src')
    assert.isOk(ormQuery)
  })
  it('should have an datastore object', () => {
    const { datastore } = require('../../src')
    assert.isOk(datastore)
  })
})
