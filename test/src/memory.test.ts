import { assert } from 'chai'
import { TextProperty } from 'functional-models'
import datastore from '../../src/datastore/memory'
import { EQUALITY_SYMBOLS, ORMType } from '../../src/constants'
import orm from '../../src/orm'
import { DatastoreProvider, OrmModelFactory } from '../../src/interfaces'
import { ValueOptional } from 'functional-models/interfaces'

type TestModelType = { name: string }
const TEST_MODEL1_NAME = 'TestModel1'
const createTestModel1 = (BaseModel: OrmModelFactory) =>
  BaseModel<TestModelType>(TEST_MODEL1_NAME, {
    properties: {
      name: TextProperty<ValueOptional<string>>(),
    },
  })

const setupMocks = (datastoreProvider: DatastoreProvider) => {
  const ormInstance = orm({ datastoreProvider })
  return {
    ormInstance,
    BaseModel: ormInstance.BaseModel,
  }
}

describe('/src/datastore/memory.js', () => {
  describe('#()', () => {
    it('should throw an exception when primaryKey is set to null', () => {
      assert.throws(() => {
        // @ts-ignore
        datastore({}, { primaryKey: null })
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
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
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
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
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
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
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
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
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
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
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
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
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
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
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
          [TEST_MODEL1_NAME]: [
            { id: '123', value: 2 },
            { id: '234', value: 3 },
            { id: '345', value: 4 },
          ],
        })
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
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
          [TEST_MODEL1_NAME]: [
            { id: '123', value: 2 },
            { id: '234', value: 3 },
            { id: '345', value: 4 },
          ],
        })
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
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
          [TEST_MODEL1_NAME]: [
            { id: '012', value: 1 },
            { id: '123', value: 2 },
            { id: '234', value: 3 },
            { id: '345', value: 4 },
          ],
        })
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
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
          [TEST_MODEL1_NAME]: [
            { id: '012', value: 1 },
            { id: '123', value: 2 },
            { id: '234', value: 3 },
            { id: '345', value: 4 },
          ],
        })
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
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
          [TEST_MODEL1_NAME]: [
            { id: '012', value: 1 },
            { id: '123', value: 2 },
            { id: '234', value: 3 },
            { id: '345', value: 4 },
          ],
        })
        const { BaseModel } = setupMocks(datastoreProvider)
        const TEST_MODEL1 = createTestModel1(BaseModel)
        const actual = (
          await datastoreProvider.search(TEST_MODEL1, {
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
        const store = datastore({ TestModel1: [myModel] })
        const { BaseModel } = setupMocks(store)
        const TEST_MODEL1 = createTestModel1(BaseModel)
        const actual = await store.retrieve(TEST_MODEL1, 'my-id')
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
      it('should return undefined when an id not used is passed', async () => {
        const myModel = { id: 'my-id', name: 'my-name' }
        const store = datastore({ TestModel1: [myModel] })
        const { BaseModel } = setupMocks(store)
        const TEST_MODEL1 = createTestModel1(BaseModel)
        const actual = await store.retrieve(TEST_MODEL1, 'not-here')
        const expected = undefined
        assert.deepEqual(actual, expected)
      })
    })
    describe('#save()', () => {
      it('should put an object in there that can be retrieved later', async () => {
        const store = datastore()
        const { BaseModel } = setupMocks(store)
        const TEST_MODEL1 = createTestModel1(BaseModel)
        const myModel = TEST_MODEL1.create({ id: 'my-id', name: 'my-name' })
        await store.save(myModel)
        const actual = await store.retrieve(TEST_MODEL1, 'my-id')
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
      it('should put be able to put two objects in that can then be retrieved later', async () => {
        const store = datastore()
        const { BaseModel } = setupMocks(store)
        const TEST_MODEL1 = createTestModel1(BaseModel)
        const myModel = TEST_MODEL1.create({ id: 'my-id', name: 'my-name' })
        await store.save(myModel)
        const myModel2 = TEST_MODEL1.create({
          id: 'my-id-2',
          name: 'my-name-2',
        })
        await store.save(myModel2)
        const actual = await store.retrieve(TEST_MODEL1, 'my-id')
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#delete()', () => {
      it('should remove an object that is stored.', async () => {
        const myModel = { id: 'my-id', name: 'my-name' }
        const store = datastore({ TestModel1: [myModel] })
        const { BaseModel } = setupMocks(store)
        const TEST_MODEL1 = createTestModel1(BaseModel)
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
