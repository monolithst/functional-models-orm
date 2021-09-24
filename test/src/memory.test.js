const assert = require('chai').assert
const { Model, UniqueId, TextProperty } = require('functional-models')
const datastore = require('../../src/datastore/memory')

const TEST_MODEL1 = Model('TestModel1', {
  id: UniqueId(),
  name: TextProperty(),
})

describe('/src/datastore/memory.js', () => {
  describe('#()', () => {
    it('should not cause an exception with no arguments', () => {
      assert.doesNotThrow(() => {
        datastore()
      })
    })
    it('should not cause an exception with an empty {} passed', () => {
      assert.doesNotThrow(() => {
        datastore({})
      })
    })

    describe('#search()', () => {})
    describe('#retrieve()', () => {
      it('should get the object stored in the db', async () => {
        const myModel = { id: 'my-id', name: 'my-name' }
        const store = datastore({ TestModel1: [myModel] })
        const actual = await store.retrieve(TEST_MODEL1, 'my-id')
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
      it('should return undefined when an id not used is passed', async () => {
        const myModel = { id: 'my-id', name: 'my-name' }
        const store = datastore({ TestModel1: [myModel] })
        const actual = await store.retrieve(TEST_MODEL1, 'not-here')
        const expected = undefined
        assert.deepEqual(actual, expected)
      })
    })
    describe('#save()', () => {
      it('should put an object in there that can be retrieved later', async () => {
        const store = datastore()
        const myModel = TEST_MODEL1.create({ id: 'my-id', name: 'my-name' })
        await store.save(myModel)
        const actual = await store.retrieve(TEST_MODEL1, 'my-id')
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#delete()', () => {
      it('should remove an object that is stored.', async () => {
        const myModel = { id: 'my-id', name: 'my-name' }
        const store = datastore({ TestModel1: [myModel] })
        const myModelInstance = TEST_MODEL1.create(myModel)
        const first = await store.retrieve(TEST_MODEL1, 'my-id')
        assert.isOk(first)
        await store.delete(myModelInstance)
        const actual = await store.retrieve(TEST_MODEL1, 'my-id')
        assert.isUndefined(actual)
      })
    })
  })
})
