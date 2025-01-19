import { assert } from 'chai'
import {
  TextProperty,
  NumberProperty,
  PrimaryKeyUuidProperty,
} from 'functional-models'
import { create as datastore } from '../../src/datastore/memory'
import { EQUALITY_SYMBOLS, ORMType } from '../../src/types'
import { create as orm } from '../../src/orm'
import { DatastoreProvider, OrmModelFactory } from '../../src/types'

type TestModelType = { id: string; name: string }
type TestModelType2 = { id: string; value: number }
type TestModelType3 = { id: string; anotherPKey: string; value: number }

const TEST_MODEL1_NAME = 'functional-models-orm-test-model-1'
const TEST_MODEL2_NAME = 'functional-models-orm-test-model-2'
const TEST_MODEL3_NAME = 'TestModel3'

const createTestModel1 = (Model: OrmModelFactory) =>
  Model<TestModelType>({
    pluralName: 'TestModel1',
    namespace: 'functional-models-orm',
    properties: {
      id: PrimaryKeyUuidProperty(),
      name: TextProperty(),
    },
  })

const createTestModel2 = (Model: OrmModelFactory) =>
  Model<TestModelType2>({
    pluralName: 'TestModel2',
    namespace: 'functional-models-orm',
    properties: {
      id: PrimaryKeyUuidProperty(),
      value: NumberProperty(),
    },
  })

const createTestModel3 = (Model: OrmModelFactory) =>
  Model<TestModelType3>({
    pluralName: 'TestModel3',
    namespace: 'functional-models-orm',
    properties: {
      id: PrimaryKeyUuidProperty(),
      anotherPKey: TextProperty(),
      value: NumberProperty(),
    },
    primaryKeyName: 'anotherPKey',
  })

const setupMocks = (datastoreProvider: DatastoreProvider) => {
  const ormInstance = orm({ datastoreProvider })
  return {
    ormInstance,
    Model: ormInstance.Model,
  }
}

describe('/src/datastore/memory.js', () => {
  describe('#()', () => {
    it('should throw an exception when getSeedPrimaryKeyName is set to null', () => {
      assert.throws(() => {
        // @ts-ignore
        datastore({}, { getSeedPrimaryKeyName: null })
      })
    })
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

    describe('#search()', () => {
      it('should return no instances when there is no modelName in the db', async () => {
        const datastoreProvider = datastore({})
        const { Model } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(Model)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
            properties: {},
            chain: [],
          })
        ).instances
        const expected: any[] = []
        assert.deepEqual(actual, expected)
      })
      it('should put the second instance on top when using sort("name", false)', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL1_NAME]: [
            { id: '123', name: 'unit-test' },
            { id: '234', name: 'unit-test-2' },
          ],
        })
        const { Model } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(Model)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
            properties: {
              name: {
                type: 'property',
                name: 'name',
                value: 'unit-test',
                valueType: ORMType.string,
                options: {
                  caseSensitive: false,
                  equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
                  endsWith: false,
                  startsWith: true,
                },
              },
            },
            sort: { type: 'sort', order: false, key: 'name' },
            chain: [],
          })
        ).instances
        const expected = [
          { id: '234', name: 'unit-test-2' },
          { id: '123', name: 'unit-test' },
        ]
        assert.deepEqual(actual, expected)
      })
      it('should find one instance when using an insensitive search', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL1_NAME]: [{ id: '123', name: 'unit-test' }],
        })
        const { Model } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(Model)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
            properties: {
              name: {
                type: 'property',
                name: 'name',
                value: 'Unit-Test',
                valueType: ORMType.string,
                options: {
                  equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
                  endsWith: false,
                  caseSensitive: false,
                  startsWith: false,
                },
              },
            },
            chain: [],
          })
        ).instances
        const expected = [{ id: '123', name: 'unit-test' }]
        assert.deepEqual(actual, expected)
      })
      it('should find no instances when using a caseSensitive search', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL1_NAME]: [{ id: '123', name: 'unit-test' }],
        })
        const { Model } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(Model)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
            properties: {
              name: {
                type: 'property',
                name: 'name',
                value: 'Unit-Test',
                valueType: ORMType.string,
                options: {
                  caseSensitive: true,
                  equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
                  endsWith: false,
                  startsWith: false,
                },
              },
            },
            chain: [],
          })
        ).instances
        const expected: any[] = []
        assert.deepEqual(actual, expected)
      })
      it('should find 1 instance when using a caseSensitive search', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL1_NAME]: [{ id: '123', name: 'unit-test' }],
        })
        const { Model } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(Model)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
            properties: {
              name: {
                type: 'property',
                name: 'name',
                value: 'unit-test',
                valueType: ORMType.string,
                options: {
                  equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
                  endsWith: false,
                  startsWith: false,
                  caseSensitive: true,
                },
              },
            },
            chain: [],
          })
        ).instances
        const expected = [{ id: '123', name: 'unit-test' }]
        assert.deepEqual(actual, expected)
      })
      it('should find 1 instance when using a caseSensitive search even though there are two objects', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL1_NAME]: [
            { id: '123', name: 'unit-test' },
            { id: '234', name: 'unit-test-2' },
          ],
        })
        const { Model } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(Model)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
            properties: {
              name: {
                type: 'property',
                name: 'name',
                value: 'unit-test',
                valueType: ORMType.string,
                options: {
                  caseSensitive: true,
                  equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
                  endsWith: false,
                  startsWith: false,
                },
              },
            },
            chain: [],
          })
        ).instances
        const expected = [{ id: '123', name: 'unit-test' }]
        assert.deepEqual(actual, expected)
      })
      it('should find 2 instances when when take is "2" and there are three matches', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL1_NAME]: [
            { id: '123', name: 'unit-test' },
            { id: '234', name: 'unit-test' },
            { id: '345', name: 'unit-test' },
          ],
        })
        const { Model } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(Model)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
            properties: {
              name: {
                type: 'property',
                name: 'name',
                value: 'unit-test',
                valueType: ORMType.string,
                options: {
                  caseSensitive: false,
                  equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
                  endsWith: false,
                  startsWith: false,
                },
              },
            },
            take: 2,
            chain: [],
          })
        ).instances
        const expected = [
          { id: '123', name: 'unit-test' },
          { id: '234', name: 'unit-test' },
        ]
        assert.deepEqual(actual, expected)
      })
      it('should find 2 instances when when greater than 2', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL2_NAME]: [
            { id: '123', value: 2 },
            { id: '234', value: 3 },
            { id: '345', value: 4 },
          ],
        })
        const { Model } = setupMocks(datastoreProvider)
        const model = createTestModel2(Model)
        const actual = (
          await datastoreProvider.search(model, {
            properties: {
              name: {
                type: 'property',
                name: 'value',
                value: 2,
                valueType: ORMType.number,
                options: {
                  equalitySymbol: EQUALITY_SYMBOLS.GT,
                },
              },
            },
            chain: [],
          })
        ).instances
        const expected = [
          { id: '234', value: 3 },
          { id: '345', value: 4 },
        ]
        assert.deepEqual(actual, expected)
      })
      it('should find 3 instances when when GTE 2', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL2_NAME]: [
            { id: '123', value: 2 },
            { id: '234', value: 3 },
            { id: '345', value: 4 },
          ],
        })
        const { Model } = setupMocks(datastoreProvider)
        const model = createTestModel2(Model)
        const actual = (
          await datastoreProvider.search(model, {
            properties: {
              name: {
                type: 'property',
                name: 'value',
                value: 2,
                valueType: ORMType.number,
                options: {
                  equalitySymbol: EQUALITY_SYMBOLS.GTE,
                },
              },
            },
            chain: [],
          })
        ).instances
        const expected = [
          { id: '123', value: 2 },
          { id: '234', value: 3 },
          { id: '345', value: 4 },
        ]
        assert.deepEqual(actual, expected)
      })
      it('should find 1 instances when when less than 2', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL2_NAME]: [
            { id: '012', value: 1 },
            { id: '123', value: 2 },
            { id: '234', value: 3 },
            { id: '345', value: 4 },
          ],
        })
        const { Model } = setupMocks(datastoreProvider)
        const model = createTestModel2(Model)
        const actual = (
          await datastoreProvider.search(model, {
            properties: {
              name: {
                type: 'property',
                name: 'value',
                value: 2,
                valueType: ORMType.number,
                options: {
                  equalitySymbol: EQUALITY_SYMBOLS.LT,
                },
              },
            },
            chain: [],
          })
        ).instances
        const expected = [{ id: '012', value: 1 }]
        assert.deepEqual(actual, expected)
      })
      it('should find 2 instances when when LTE 2', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL2_NAME]: [
            { id: '012', value: 1 },
            { id: '123', value: 2 },
            { id: '234', value: 3 },
            { id: '345', value: 4 },
          ],
        })
        const { Model } = setupMocks(datastoreProvider)
        const model = createTestModel2(Model)
        const actual = (
          await datastoreProvider.search(model, {
            properties: {
              name: {
                type: 'property',
                name: 'value',
                value: 2,
                valueType: ORMType.number,
                options: {
                  equalitySymbol: EQUALITY_SYMBOLS.LTE,
                },
              },
            },
            chain: [],
          })
        ).instances
        const expected = [
          { id: '123', value: 2 },
          { id: '012', value: 1 },
        ]
        assert.deepEqual(actual, expected)
      })
      it('should find 1 instances when when = 2', async () => {
        const datastoreProvider = datastore({
          [TEST_MODEL2_NAME]: [
            { id: '012', value: 1 },
            { id: '123', value: 2 },
            { id: '234', value: 3 },
            { id: '345', value: 4 },
          ],
        })
        const { Model } = setupMocks(datastoreProvider)
        const model = createTestModel2(Model)
        const actual = (
          await datastoreProvider.search(model, {
            properties: {
              name: {
                type: 'property',
                name: 'value',
                value: 2,
                valueType: ORMType.number,
                options: {
                  equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
                },
              },
            },
            chain: [],
          })
        ).instances
        const expected = [{ id: '123', value: 2 }]
        assert.deepEqual(actual, expected)
      })
    })
    describe('#retrieve()', () => {
      it('should get the object stored in the db', async () => {
        const myModel = { id: 'my-id', name: 'my-name' }
        const store = datastore({ [TEST_MODEL1_NAME]: [myModel] })
        const { Model } = setupMocks(store)
        const TEST_MODEL1 = createTestModel1(Model)
        const actual = await store.retrieve(TEST_MODEL1, 'my-id')
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
      it('should return undefined when an id not used is passed', async () => {
        const myModel = { id: 'my-id', name: 'my-name' }
        const store = datastore({ TestModel1: [myModel] })
        const { Model } = setupMocks(store)
        const TEST_MODEL1 = createTestModel1(Model)
        const actual = await store.retrieve(TEST_MODEL1, 'not-here')
        const expected = undefined
        assert.deepEqual(actual, expected)
      })
    })
    describe('#save()', () => {
      it('should use the getModelDefinitions.primaryKey from the model when saving', async () => {
        const store = datastore()
        const { Model } = setupMocks(store)
        const TEST_MODEL3 = createTestModel3(Model)
        const myModel = TEST_MODEL3.create<'id'>({
          anotherPKey: 'my-id',
          value: 123,
        })
        await store.save<TestModelType3>(myModel)
        const actual = await store.retrieve(TEST_MODEL3, 'my-id')
        const expected = { anotherPKey: 'my-id', value: 123 }
        assert.deepNestedInclude(actual, expected)
      })
      it('should put an object in there that can be retrieved later', async () => {
        const store = datastore()
        const { Model } = setupMocks(store)
        const TEST_MODEL1 = createTestModel1(Model)
        const myModel = TEST_MODEL1.create({ id: 'my-id', name: 'my-name' })
        await store.save<TestModelType>(myModel)
        const actual = await store.retrieve(TEST_MODEL1, 'my-id')
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
      it('should put be able to put two objects in that can then be retrieved later', async () => {
        const store = datastore()
        const { Model } = setupMocks(store)
        const TEST_MODEL1 = createTestModel1(Model)
        const myModel = TEST_MODEL1.create({ id: 'my-id', name: 'my-name' })
        await store.save<TestModelType>(myModel)
        const myModel2 = TEST_MODEL1.create({
          id: 'my-id-2',
          name: 'my-name-2',
        })
        await store.save<TestModelType>(myModel2)
        const actual = await store.retrieve(TEST_MODEL1, 'my-id')
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#delete()', () => {
      it('should remove an object that is stored.', async () => {
        const myModel = { id: 'my-id', name: 'my-name' }
        const store = datastore({ [TEST_MODEL1_NAME]: [myModel] })
        const { Model } = setupMocks(store)
        const TEST_MODEL1 = createTestModel1(Model)
        const myModelInstance = TEST_MODEL1.create(myModel)
        const first = await store.retrieve(TEST_MODEL1, 'my-id')
        assert.isOk(first)
        await store.delete<TestModelType>(myModelInstance)
        const actual = await store.retrieve(TEST_MODEL1, 'my-id')
        assert.isUndefined(actual)
      })
    })
  })
})
