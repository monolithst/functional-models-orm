import { assert } from 'chai'
import sinon from 'sinon'
import createDatastore from '../../src/datastore/memory'
import orm from '../../src/orm'
import { LastModifiedDateProperty } from '../../src/properties'
import { BaseModel, TextProperty, UniqueId } from 'functional-models'
import { OrmModelInstance } from '../../src/interfaces'
import { ormQueryBuilder } from '../../src/ormQuery'

describe('/src/orm.ts', () => {
  describe('#orm()', () => {
    it('should throw an exception if no datastore is provided', () => {
      const datastoreProvider = null
      assert.throws(() => {
        // @ts-ignore
        const instance = orm({ datastoreProvider })
      })
    })
    it('should create an object without exception if a datastoreProvider is passed', () => {
      const datastoreProvider = createDatastore()
      assert.doesNotThrow(() => {
        const instance = orm({ datastoreProvider })
      })
    })
    it('should create an object without exception if a datastoreProvider and a BaseModel is passed', () => {
      const datastoreProvider = createDatastore()
      assert.doesNotThrow(() => {
        const instance = orm({ datastoreProvider, BaseModel })
      })
    })

    describe('#BaseModel()', () => {
      it('should pass the modelname to the BaseModel', () => {
        const datastoreProvider = createDatastore()
        const instance = orm({ datastoreProvider, BaseModel })
        const model = instance.BaseModel('MyModel', { properties: {} }, {})
        const actual = model.getName()
        const expected = 'MyModel'
        assert.deepEqual(actual, expected)
      })
      it('should have functions.search', () => {
        const datastoreProvider = createDatastore()
        const instance = orm({ datastoreProvider, BaseModel })
        const model = instance.BaseModel('MyModel', { properties: {} }, {})
        const actual = model.search
        assert.isFunction(actual)
      })
      it('should allow not passing a modelOptions', () => {
        const datastoreProvider = createDatastore()
        const instance = orm({ datastoreProvider, BaseModel })
        assert.doesNotThrow(() => {
          instance.BaseModel('MyModel', { properties: {} })
        })
      })
      describe('#createAndSave()', () => {
        it('should call create() and then call save() when createAndSave() is not available on the datastoreProvider', async () => {
          const datastoreProvider = createDatastore()
          const save = sinon
            .stub()
            .resolves({ id: 'test-me', name: 'hello world' })
          const instance = orm({ datastoreProvider })
          const model = instance.BaseModel<{ name: string }>('MyModel', {
            properties: { name: TextProperty() },
          })
          const modelInstance = model.create({ name: 'hello world' })
          const create = sinon.stub().returns({
            save,
            toObj: () =>
              Promise.resolve({ id: 'test-me', name: 'hello world' }),
          })
          // @ts-ignore
          model.create = create
          const result = await model.createAndSave(modelInstance)
          sinon.assert.calledOnce(save)
          sinon.assert.calledOnce(create)
        })
        it('should call datastoreProvider.createAndSave() when available', async () => {
          const datastoreProvider = createDatastore()
          const createAndSave = sinon
            .stub()
            .resolves({ id: 'test-me', name: 'hello world' })
          // @ts-ignore
          datastoreProvider.createAndSave = createAndSave
          const instance = orm({ datastoreProvider })
          const model = instance.BaseModel<{ name: string }>('MyModel', {
            properties: { name: TextProperty() },
          })
          const modelInstance = model.create({ name: 'hello world' })
          await model.createAndSave(modelInstance)
          sinon.assert.calledOnce(createAndSave)
        })
      })
      describe('#create()', () => {
        it('should call the modelOptions.instanceCreatedCallback that is passed in', () => {
          const datastoreProvider = createDatastore()
          const instanceCreatedCallback = sinon.stub()
          const instance = orm({ datastoreProvider })
          const model = instance.BaseModel(
            'MyModel',
            { properties: {} },
            { instanceCreatedCallback }
          )
          model.create({})
          sinon.assert.calledOnce(instanceCreatedCallback)
        })
        it('should call the modelOptions.instanceCreatedCallback that is passed in, even if its an array', () => {
          const datastoreProvider = createDatastore()
          const instanceCreatedCallback = sinon.stub()
          const instance = orm({ datastoreProvider })
          const model = instance.BaseModel(
            'MyModel',
            { properties: {} },
            { instanceCreatedCallback: [instanceCreatedCallback] }
          )
          model.create({})
          sinon.assert.calledOnce(instanceCreatedCallback)
        })
        it('should return an instance where meta.isDirty === true', async () => {
          const datastoreProvider = {
            save: sinon.stub().returns({ name: 'my-name' }),
          }
          // @ts-ignore
          const instance = orm({ datastoreProvider, BaseModel })
          const model = instance.BaseModel<{ name: string }>(
            'MyModel',
            {
              properties: {
                name: TextProperty({ required: true }),
              },
            },
            {}
          )
          const actual = model.create({
            name: 'my-name',
          })
          assert.isTrue(actual.methods.isDirty())
        })
        describe('#delete()', () => {
          it('should replace delete() with DeleteOverride when passed into options', async () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreProvider, BaseModel })
            const deleteObj = sinon.stub().resolves({})
            const model = instance.BaseModel(
              'MyModel',
              { properties: {} },
              { delete: deleteObj }
            )
            const modelInstance = model.create({})
            await modelInstance.delete()
            sinon.assert.calledOnce(deleteObj)
          })
          it('should call datastoreProvider.delete with the model and id', async () => {
            const datastoreProvider = {
              delete: sinon.stub().resolves({}),
            }
            // @ts-ignore
            const instance = orm({ datastoreProvider, BaseModel })
            const model = instance.BaseModel<{ name: string }>(
              'MyModel',
              {
                properties: {
                  name: TextProperty({ required: true }),
                },
              },
              {}
            )
            const modelInstance = model.create({
              id: 'my-id',
              name: 'my-name',
            })
            await modelInstance.delete()
            const actual = datastoreProvider.delete.getCall(0).args
            const expected = [modelInstance]
            assert.deepEqual(actual, expected)
          })
        })
        describe('#save()', () => {
          it('should change lastModified field from "2021-01-01T00:00:01Z" when lastModifiedUpdateMethod exists on a property', async () => {
            const datastoreProvider = sinon.spy(createDatastore())
            // @ts-ignore
            const instance = orm({ datastoreProvider, BaseModel })
            const model = instance.BaseModel<{ lastModified: Date }>(
              'MyModel',
              {
                properties: {
                  lastModified: LastModifiedDateProperty(),
                },
              },
              {}
            )
            const modelInstance = model.create({
              lastModified: new Date('2021-01-01T00:00:01Z'),
            })
            const newModel = await modelInstance.save()
            const actual = (
              (await newModel.get.lastModified()) as Date
            ).toISOString()
            const expected = '2021-01-01T00:00:01Z'
            assert.notEqual(actual, expected)
          })
          it('should have a .save() function', () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreProvider, BaseModel })
            const model = instance.BaseModel('MyModel', { properties: {} }, {})
            const modelInstance = model.create({})
            assert.isFunction(modelInstance.save)
          })
          it('should replace save() with SaveOverride when passed into options', async () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreProvider, BaseModel })
            const save = sinon.stub().resolves({})
            const model = instance.BaseModel(
              'MyModel',
              { properties: {} },
              { save }
            )
            const modelInstance = model.create({})
            await modelInstance.save()
            sinon.assert.calledOnce(save)
          })
          it('should throw an exception if the model has validation errors and save is called', () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreProvider, BaseModel })
            const model = instance.BaseModel<{ name: string }>(
              'MyModel',
              {
                properties: {
                  name: TextProperty({ required: true }),
                },
              },
              {}
            )
            // @ts-ignore
            const modelInstance = model.create({})
            return modelInstance
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
            // @ts-ignore
            const instance = orm({ datastoreProvider, BaseModel })
            const model = instance.BaseModel<{ name: string }>(
              'MyModel',
              {
                properties: {
                  name: TextProperty({ required: true }),
                },
              },
              {}
            )
            const modelInstance = model.create({
              name: 'my-name',
            })
            await modelInstance.save()
            const actual = datastoreProvider.save.getCall(0).args[0]
            const expected = modelInstance
            assert.deepEqual(actual, expected)
          })
          it('should return an instance where methods.isDirty() === false', async () => {
            const datastoreProvider = {
              save: sinon.stub().returns({ name: 'my-name' }),
            }
            // @ts-ignore
            const instance = orm({ datastoreProvider, BaseModel })
            const model = instance.BaseModel<{ name: string }>(
              'MyModel',
              {
                properties: {
                  name: TextProperty({ required: true }),
                },
              },
              {}
            )
            const modelInstance = model.create({
              name: 'my-name',
            })
            const actual = await modelInstance.save()
            assert.isFalse(actual.methods.isDirty())
          })
        })
      })
      describe('#retrieve()', () => {
        it('should pass the model and id to the datastoreProvider.search', async () => {
          const datastoreProvider = {
            retrieve: sinon.stub().resolves(null),
          }
          // @ts-ignore
          const instance = orm({ datastoreProvider, BaseModel })
          const model = instance.BaseModel('MyModel', { properties: {} }, {})
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
            search: sinon.stub().resolves({ page: null, instances: [] }),
          }
          // @ts-ignore
          const instance = orm({ datastoreProvider, BaseModel })
          const model = instance.BaseModel('MyModel', { properties: {} }, {})
          const ormQuery = ormQueryBuilder().compile()
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
        // @ts-ignore
        const instance = orm({ datastoreProvider, BaseModel })
        const model = instance.BaseModel<{}>('MyModel', { properties: {} }, {})
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
        // @ts-ignore
        const instance = orm({ datastoreProvider, BaseModel })
        const model = instance.BaseModel<{ name: string }>(
          'MyModel',
          {
            properties: {
              name: TextProperty(),
            },
          },
          {}
        )

        // @ts-ignore
        const actual = await (
          await instance.fetcher<{ name: string }>(model, 'my-id')
          // @ts-ignore
        ).toObj()
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#bulkInsert()', () => {
      it('should call save() on each object, if datastoreProvider does not handle bulkInserts', async () => {
        const datastoreProvider = createDatastore()
        const save = sinon
          .stub()
          .resolves({ id: 'test-me', name: 'hello world' })
        const instance = orm({ datastoreProvider })
        const model = instance.BaseModel<{ name: string }>('MyModel', {
          properties: { name: TextProperty() },
        })
        const modelInstance = model.create({ name: 'hello world' })
        modelInstance.save = save
        const modelInstance2 = model.create({ name: 'hello world' })
        modelInstance2.save = save
        const modelInstance3 = model.create({ name: 'hello world' })
        modelInstance3.save = save
        const modelInstance4 = model.create({ name: 'hello world' })
        modelInstance4.save = save
        await model.bulkInsert([
          modelInstance,
          modelInstance2,
          modelInstance3,
          modelInstance4,
        ])
        sinon.assert.callCount(save, 4)
      })
      it('should call datastoreProvider.bulkInsert() when available', async () => {
        const datastoreProvider = createDatastore()
        const bulkInsert = sinon.stub().resolves({})
        // @ts-ignore
        datastoreProvider.bulkInsert = bulkInsert
        const instance = orm({ datastoreProvider })
        const model = instance.BaseModel<{ name: string }>('MyModel', {
          properties: { name: TextProperty() },
        })
        const modelInstance = model.create({ name: 'hello world' })
        await model.bulkInsert([modelInstance])
        sinon.assert.calledOnce(bulkInsert)
      })
    })
  })
})
