const assert = require('chai').assert
const sinon = require('sinon')
const createDatastore = require('../../src/datastore/memory')
const orm = require('../../src/orm')
const { Model, TextProperty, UniqueId } = require('functional-models')

describe('/src/orm.js', () => {
  describe('#orm()', () => {
    it('should throw an exception if no datastore is provided', () => {
      const datastoreProvider = null
      assert.throws(() => {
        const instance = orm({ datastoreProvider })
      })
    })
    it('should create an object without exception if a datastoreProvider is passed', () => {
      const datastoreProvider = createDatastore()
      assert.doesNotThrow(() => {
        const instance = orm({ datastoreProvider })
      })
    })
    it('should create an object without exception if a datastoreProvider and a modelObj is passed', () => {
      const datastoreProvider = createDatastore()
      assert.doesNotThrow(() => {
        const instance = orm({ datastoreProvider, modelObj: Model })
      })
    })

    describe('#Model()', () => {
      it('should pass the modelname to the modelObj', () => {
        const datastoreProvider = createDatastore()
        const instance = orm({ datastoreProvider, modelObj: Model })
        const model = instance.Model('MyModel', {}, {})
        const actual = model.getName()
        const expected = 'MyModel'
        assert.deepEqual(actual, expected)
      })
      it('should have functions.search', () => {
        const datastoreProvider = createDatastore()
        const instance = orm({ datastoreProvider, modelObj: Model })
        const model = instance.Model('MyModel', {}, {})
        const actual = model.search
        assert.isFunction(actual)
      })
      describe('#create()', () => {
        describe('#delete()', () => {
          it('should call datastoreProvider.delete with the model and id', async () => {
            const datastoreProvider = {
              delete: sinon.stub().resolves({}),
            }
            const instance = orm({ datastoreProvider, modelObj: Model })
            const model = instance.Model(
              'MyModel',
              {
                id: UniqueId(),
                name: TextProperty({ required: true }),
              },
              {}
            )
            const modelInstance = model.create({
              id: 'my-id',
              name: 'my-name',
            })
            await modelInstance.functions.delete()
            const actual = datastoreProvider.delete.getCall(0).args
            const expected = [modelInstance]
            assert.deepEqual(actual, expected)
          })
        })
        describe('#save()', () => {
          it('should have a functions.save function', () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreProvider, modelObj: Model })
            const model = instance.Model('MyModel', {}, {})
            const modelInstance = model.create({})
            assert.isFunction(modelInstance.functions.save)
          })
          it('should throw an exception if the model has validation errors and save is called', () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreProvider, modelObj: Model })
            const model = instance.Model(
              'MyModel',
              {
                name: TextProperty({ required: true }),
              },
              {}
            )
            const modelInstance = model.create({})
            return modelInstance.functions
              .save()
              .then(() => {
                assert.fail('no exception')
              })
              .catch(() => {})
          })
          it('should call datastoreProvider.save with the instance', async () => {
            const datastoreProvider = {
              save: sinon.stub().returns({ name: 'my-name' }),
            }
            const instance = orm({ datastoreProvider, modelObj: Model })
            const model = instance.Model(
              'MyModel',
              {
                name: TextProperty({ required: true }),
              },
              {}
            )
            const modelInstance = model.create({
              name: 'my-name',
            })
            await modelInstance.functions.save()
            const actual = datastoreProvider.save.getCall(0).args[0]
            const expected = modelInstance
            assert.deepEqual(actual, expected)
          })
          it('should return an instance where meta.isDirty === false', async () => {
            const datastoreProvider = {
              save: sinon.stub().returns({ name: 'my-name' }),
            }
            const instance = orm({ datastoreProvider, modelObj: Model })
            const model = instance.Model(
              'MyModel',
              {
                name: TextProperty({ required: true }),
              },
              {}
            )
            const modelInstance = model.create({
              name: 'my-name',
            })
            const actual = await modelInstance.functions.save()
            assert.isFalse(actual.meta.isDirty())
          })
        })
      })
      describe('#retrieve()', () => {
        it('should pass the model and id to the datastoreProvider.search', async () => {
          const datastoreProvider = {
            retrieve: sinon.stub().resolves(null),
          }
          const instance = orm({ datastoreProvider, modelObj: Model })
          const model = instance.Model('MyModel', {}, {})
          const id = 123
          await model.retrieve(id)
          const actual = datastoreProvider.retrieve.getCall(0).args
          const expected = [model, id]
          assert.deepEqual(actual, expected)
        })
      })
      describe('#search()', () => {
        it('should pass the model and ormQuery to the datastoreProvider.search', async () => {
          const datastoreProvider = {
            search: sinon.stub().resolves([]),
          }
          const instance = orm({ datastoreProvider, modelObj: Model })
          const model = instance.Model('MyModel', {}, {})
          const ormQuery = { test: 'me' }
          await model.search(ormQuery)
          const actual = datastoreProvider.search.getCall(0).args
          const expected = [model, ormQuery]
          assert.deepEqual(actual, expected)
        })
      })
    })
    describe('#fetcher()', () => {
      it('should call the datastoreProvider.retrieve with the model and id', async () => {
        const datastoreProvider = {
          retrieve: sinon.stub().resolves(undefined),
        }
        const instance = orm({ datastoreProvider, modelObj: Model })
        const model = instance.Model('MyModel', {}, {})
        await instance.fetcher(model, 'my-id')

        const actual = datastoreProvider.retrieve.getCall(0).args
        const expected = [model, 'my-id']
        assert.deepEqual(actual, expected)
      })
      it('should return expected model instance', async () => {
        const datastoreProvider = {
          retrieve: sinon.stub().resolves({
            id: 'my-id',
            name: 'my-name',
          }),
        }
        const instance = orm({ datastoreProvider, modelObj: Model })
        const model = instance.Model(
          'MyModel',
          {
            id: UniqueId(),
            name: TextProperty(),
          },
          {}
        )

        const actual = await (
          await instance.fetcher(model, 'my-id')
        ).functions.toObj()
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
    })
  })
})
