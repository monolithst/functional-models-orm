const assert = require('chai').assert
const { Given, When, Then } = require('cucumber')
const { Property, Model, UniqueId } = require('functional-models')
const orm = require('../../dist/orm')
const { ormQueryBuilder } = require('../../dist/ormQuery')
const memoryDatastoreProvider = require('../../dist/datastore/memory')

const DATASTORES = {
  MemoryDatastoreProvider: memoryDatastoreProvider(),
}

const ListModelQuery1 = () => {
  return ormQueryBuilder().property('name', 'test1').compile()
}

const QUERY_BUILDER_FUNCS = {
  ListModelQuery1,
}

const MODELS = {
  Model1: [
    'Model1',
    {
      id: UniqueId(),
      name: Property('MyProperty'),
    },
  ],
}

const MODEL_DATA = {
  ModelData1: {
    id: 'test-id',
    name: 'test-name',
  },
  ListModelData1: [
    { name: 'test1' },
    { name: 'test2' },
    { name: 'test2' },
    { name: 'test2' },
    { name: 'Test1' },
    { name: 'TEST1' },
    { name: 'test-4' },
    { name: 'teST2' },
    { name: 'test3' },
  ],
}

Given('orm using the {word}', function (store) {
  store = DATASTORES[store]
  if (!store) {
    throw new Error(`${store} did not result in a datastore.`)
  }

  this.Model = orm({ datastoreProvider: store }).Model
  this.datastoreProvider = store
})

Given('the orm is used to create {word}', function (modelType) {
  const model = MODELS[modelType]
  if (!model) {
    throw new Error(`${modelType} did not result in a model.`)
  }
  this.model = this.Model(...model)
})

Given('the ormQueryBuilder is used to make {word}', function (queryKey) {
  if (!QUERY_BUILDER_FUNCS[queryKey]) {
    throw new Error(`${queryKey} did not result in a query`)
  }

  this.query = QUERY_BUILDER_FUNCS[queryKey]()
})

When('instances of the model are created with {word}', function (dataKey) {
  if (!MODEL_DATA[dataKey]) {
    throw new Error(`${dataKey} did not result in data.`)
  }
  this.instances = MODEL_DATA[dataKey].map(this.model.create)
})

When('an instance of the model is created with {word}', function (dataKey) {
  const data = MODEL_DATA[dataKey]
  if (!data) {
    throw new Error(`${dataKey} did not result in a data object.`)
  }
  this.modelInstance = this.model.create(data)
})

When('save is called on the instances', function () {
  return Promise.all(this.instances.map(x => x.save()))
})

When('save is called on the model', function () {
  return this.modelInstance.save().then(x => (this.saveResult = x))
})

When('delete is called on the model', function () {
  return this.modelInstance.functions
    .delete()
    .then(x => (this.deleteResult = x))
})

When("the datastore's retrieve is called with values", function (table) {
  const rows = table.rowsHash()
  const id = rows.id
  return this.datastoreProvider.retrieve(this.model, id).then(obj => {
    this.result = obj
  })
})

When('search is called on the Model using the query', function () {
  this.model.search(this.query).then(x => (this.searchResults = x))
})

Then('the result matches {word}', function (dataKey) {
  const data = MODEL_DATA[dataKey]
  assert.deepEqual(this.result, data)
})

Then('{int} search results are found', function (count) {
  assert.equal(this.searchResults.instances.length, count)
})
