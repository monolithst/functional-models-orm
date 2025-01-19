import sinon from 'sinon'
import { assert } from 'chai'
import { TextProperty, PrimaryKeyUuidProperty } from 'functional-models'
import { create as orm } from '../../src/orm'
import { create as memoryDatastoreProvider } from '../../src/datastore/memory'
import {
  uniqueTogether,
  unique,
  buildOrmValidatorContext,
} from '../../src/validation'
import {
  OrmModelFactory,
  OrmQuery,
  PropertyStatement,
  OrmModel,
} from '../../src/types'

type TestType1 = { id: string; name?: string; description?: string }

const setupMocks = () => {
  const datastoreProvider = {
    save: sinon.stub(),
    delete: sinon.stub(),
    search: sinon.stub(),
    retrieve: sinon.stub(),
  }
  const instance = orm({ datastoreProvider })
  return {
    ormInstance: instance,
    Model: instance.Model,
  }
}

const createTestModel1 = (Model: OrmModelFactory) =>
  Model<TestType1>({
    pluralName: 'TestModel1',
    namespace: 'functional-models',
    properties: {
      id: PrimaryKeyUuidProperty({ defaultValue: 'test-id' }),
      name: TextProperty(),
      description: TextProperty(),
    },
  })

describe('/src/validation.js', () => {
  describe('#unique()', () => {
    it('should call search model.search', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [],
        page: null,
      })
      const instance = model.create<'id'>({
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      await unique<TestType1>('name')('my-name', instance, instanceData, {})
      // @ts-ignore
      sinon.assert.calledOnce(model.search)
    })
    it('should return an error when 1 instance is returned with a different id but same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await unique<TestType1>('name')(
        'my-name',
        instance,
        instanceData,
        {}
      )
      assert.isOk(actual)
    })
    it('should return undefined when 1 instance is returned with the same id and same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await unique<TestType1>('name')(
        'name',
        instance,
        instanceData,
        {}
      )
      assert.isUndefined(actual)
    })
    it('should return undefined when 2 instances are returned with one having the same id and same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            name: 'my-name',
          }),
          model.create({
            id: 'test-id',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await unique<TestType1>('name')(
        'name',
        instance,
        instanceData,
        {}
      )
      assert.isUndefined(actual)
    })
    it('should return an error when 2 instances are returned with none having the same id but having the same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            name: 'my-name',
          }),
          model.create({
            id: 'test-id-something-else',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await unique<TestType1>('name')(
        'name',
        instance,
        instanceData,
        {}
      )
      assert.isOk(actual)
    })
  })
  describe('#uniqueTogether()', () => {
    it('should created an ormQuery with each propertyKey passed in', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      const search = sinon.stub().resolves({
        instances: [],
        page: null,
      })
      // @ts-ignore
      model.search = search
      const instance = model.create<'id'>({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        {}
      )

      const ormQuery = search.getCall(0).args[0] as OrmQuery
      const actual = Object.entries(ormQuery.properties).map(
        ([key, partial]) => {
          return [key, (partial as PropertyStatement).value]
        }
      )
      const expected = [
        ['name', 'my-name'],
        ['description', 'my-description'],
      ]
      assert.deepEqual(actual, expected)
    })
    it('should call search model.search', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      const search = sinon.stub().resolves({
        instances: [],
        page: null,
      })
      // @ts-ignore
      model.search = search
      const instance = model.create<'id'>({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        {}
      )
      sinon.assert.calledOnce(search)
    })
    it('should call search model.search when no options is passed in', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      const search = sinon.stub().resolves({
        instances: [],
        page: null,
      })
      // @ts-ignore
      model.search = search
      const instance = model.create<'id'>({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        {}
      )
      sinon.assert.calledOnce(search)
    })
    it('should not call search model.search when noOrmValidation is true', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      const search = sinon.stub().resolves({
        instances: [],
        page: null,
      })
      // @ts-ignore
      model.search = search
      const instance = model.create<'id'>({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        { noOrmValidation: true }
      )
      sinon.assert.notCalled(search)
    })
    it('should return an error when 1 instance is returned with a different id but same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            name: 'my-name',
            description: 'my-description',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await uniqueTogether<TestType1>(['name'])(
        instance,
        instanceData,
        {}
      )
      assert.isOk(actual)
    })
    it('should return undefined when 1 instance is returned with the same id and same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id',
            description: 'my-description',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        description: 'my-description',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await uniqueTogether<TestType1>(['name'])(
        instance,
        instanceData,
        {}
      )
      assert.isUndefined(actual)
    })
    it('should return undefined when 2 instances are returned with one having the same id and same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            description: 'my-description',
            name: 'my-name',
          }),
          model.create({
            id: 'test-id',
            description: 'my-description',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        description: 'my-description',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await uniqueTogether<TestType1>(['name'])(
        instance,
        instanceData,
        {}
      )
      assert.isUndefined(actual)
    })
    it('should return an error when 2 instances are returned with none having the same id but having the same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            description: 'my-description',
            name: 'my-name',
          }),
          model.create({
            id: 'test-id-something-else',
            description: 'my-description',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        description: 'my-description',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        {}
      )
      const expected = `name,description must be unique together. Another instance found.`
      assert.deepEqual(actual, expected)
    })
  })
  describe('#buildOrmValidationOptions()', () => {
    it('should return noOrmValidation=false when nothing is passed in', () => {
      const instance = buildOrmValidatorContext({})
      const actual = instance.noOrmValidation
      const expected = false
      assert.equal(actual, expected)
    })
    it('should return noOrmValidation=true when passed in', () => {
      const instance = buildOrmValidatorContext({ noOrmValidation: true })
      const actual = instance.noOrmValidation
      const expected = true
      assert.equal(actual, expected)
    })
  })
})
