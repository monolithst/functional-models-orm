const sinon = require('sinon')
const assert = require('chai').assert
const { Model, TextProperty } = require('functional-models')
const memoryDatastoreProvider = require('../../src/datastore/memory')
const {
  uniqueTogether,
  unique
} = require('../../src/validation')

const createTestModel1 = () => Model('TestModel1', {
  id: TextProperty({value:'test-id'}),
  name: TextProperty(),
  description: TextProperty(),
})

describe('/src/validation.js', () => {
  describe('#unique()', () => {
    it('should call search model.search', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [],
        page: null
      })
      const instance = model.create({
        name: 'my-name'
      })
      const instanceData = await instance.functions.toObj()
      await unique('name')(instance, instanceData)

      sinon.assert.calledOnce(model.search)
    })
    it('should return an error when 1 instance is returned with a different id but same value', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [{
          id: 'test-id-older',
          name: 'my-name'
        }],
        page: null
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name'
      })
      const instanceData = await instance.functions.toObj()
      const actual = await unique('name')(instance, instanceData)
      assert.isOk(actual)
    })
    it('should return undefined when 1 instance is returned with the same id and same value', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [{
          id: 'test-id',
          name: 'my-name'
        }],
        page: null
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name'
      })
      const instanceData = await instance.functions.toObj()
      const actual = await unique('name')(instance, instanceData)
      assert.isUndefined(actual)
    })
    it('should return undefined when 2 instances are returned with one having the same id and same value', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [{
          id: 'test-id-older',
          name: 'my-name'
        },{
          id: 'test-id',
          name: 'my-name'
        }],
        page: null
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name'
      })
      const instanceData = await instance.functions.toObj()
      const actual = await unique('name')(instance, instanceData)
      assert.isUndefined(actual)
    })
    it('should return an error when 2 instances are returned with none having the same id but having the same value', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [{
          id: 'test-id-older',
          name: 'my-name'
        },{
          id: 'test-id-something-else',
          name: 'my-name'
        }],
        page: null
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name'
      })
      const instanceData = await instance.functions.toObj()
      const actual = await unique('name')(instance, instanceData)
      assert.isOk(actual)
    })
  })
  describe('#uniqueTogether()', () => {
    it('should created an ormQuery with each propertyKey passed in', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [],
        page: null
      })
      const instance = model.create({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.functions.toObj()
      await uniqueTogether(['name', 'description'])(instance, instanceData)

      const ormQuery = model.search.getCall(0).args[0]
      const actual = Object.entries(ormQuery.properties).map(([key,partial])=> {
        return [key, partial.value]
      })
      const expected = [['name', 'my-name'],['description', 'my-description']]
      assert.deepEqual(actual, expected)
    })
    it('should call search model.search', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [],
        page: null
      })
      const instance = model.create({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.functions.toObj()
      await uniqueTogether(['name', 'description'])(instance, instanceData)

      sinon.assert.calledOnce(model.search)
    })
    it('should return an error when 1 instance is returned with a different id but same value', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [{
          id: 'test-id-older',
          name: 'my-name',
          description: 'my-description',
        }],
        page: null
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.functions.toObj()
      const actual = await uniqueTogether(['name'])(instance, instanceData)
      assert.isOk(actual)
    })
    it('should return undefined when 1 instance is returned with the same id and same value', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [{
          id: 'test-id',
          description: 'my-description',
          name: 'my-name'
        }],
        page: null
      })
      const instance = model.create({
        id: 'test-id',
        description: 'my-description',
        name: 'my-name'
      })
      const instanceData = await instance.functions.toObj()
      const actual = await uniqueTogether(['name'])(instance, instanceData)
      assert.isUndefined(actual)
    })
    it('should return undefined when 2 instances are returned with one having the same id and same value', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [{
          id: 'test-id-older',
          description: 'my-description',
          name: 'my-name'
        },{
          id: 'test-id',
          description: 'my-description',
          name: 'my-name'
        }],
        page: null
      })
      const instance = model.create({
        id: 'test-id',
        description: 'my-description',
        name: 'my-name'
      })
      const instanceData = await instance.functions.toObj()
      const actual = await uniqueTogether(['name'])(instance, instanceData)
      assert.isUndefined(actual)
    })
    it('should return an error when 2 instances are returned with none having the same id but having the same value', async () => {
      const model = createTestModel1()
      model.search = sinon.stub().resolves({
        instances: [{
          id: 'test-id-older',
          description: 'my-description',
          name: 'my-name'
        },{
          id: 'test-id-something-else',
          description: 'my-description',
          name: 'my-name'
        }],
        page: null
      })
      const instance = model.create({
        id: 'test-id',
        description: 'my-description',
        name: 'my-name'
      })
      const instanceData = await instance.functions.toObj()
      const actual = await uniqueTogether(['name', 'description'])(instance, instanceData)
      const expected = `name,description must be unique together. Another instance found.`
      assert.deepEqual(actual, expected)
    })

  })
})