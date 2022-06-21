import merge from 'lodash/merge'
import values from 'lodash/values'
import flatten from 'lodash/flatten'
import get from 'lodash/get'
import orderBy from 'lodash/orderBy'
import isBefore from 'date-fns/isBefore'
import isAfter from 'date-fns/isAfter'
import isEqual from 'date-fns/isEqual'
import {
  FunctionalModel,
  JsonAble, Model, ModelInstance,
  ModelInstanceInputData,
  PrimaryKeyType,
} from 'functional-models/interfaces'
import {
  DatastoreProvider,
  OrmModel,
  OrmModelInstance,
  OrmQuery,
  DatesBeforeStatement,
  DatastoreSearchResult,
} from '../interfaces'

const _getDbEntryInfo = async <
  T extends FunctionalModel,
  TModel extends Model<T>
>(
  instance: ModelInstance<T, TModel>
) => {
  const modelName: string = instance.getModel().getName()
  const obj = await instance.toObj()
  // eslint-disable-next-line functional/prefer-readonly-type
  const r: [s: string, o: JsonAble] = [modelName, obj]
  return r
}

type ModelType = string
type SeedModels = {
  // eslint-disable-next-line functional/prefer-readonly-type
  [s: ModelType]: readonly ModelInstanceInputData<any>[]
}

type ModelsDb = {
  // eslint-disable-next-line functional/prefer-readonly-type
  [s: ModelType]: {
    // eslint-disable-next-line functional/prefer-readonly-type
    [s: PrimaryKeyType]: readonly ModelInstanceInputData<any>[]
  }
}

type SimpleObj = {
  // eslint-disable-next-line functional/prefer-readonly-type
  [s: string]: any
}

const memoryDatastoreProvider = (
  seedModelsByModelName: SeedModels = {},
  { getSeedPrimaryKeyName = () => 'id' } = {}
): DatastoreProvider => {
  if (!getSeedPrimaryKeyName) {
    throw new Error(`Configuration must include getSeedPrimaryKey.`)
  }
  const db: ModelsDb = Object.entries(seedModelsByModelName).reduce(
    (acc, [modelName, models]) => {
      const data = models.reduce((inner, model) => {
        // @ts-ignore
        return { ...(inner as object), [model[getSeedPrimaryKeyName(model)]]: model }
      }, {})
      return merge({}, acc, { [modelName]: data })
    },
    {}
  )

  const save = <T extends FunctionalModel, TModel extends Model<T>>(
    instance: ModelInstance<T, TModel>
  ): Promise<ModelInstanceInputData<T>> => {
    return (
      Promise.resolve()
        // eslint-disable-next-line no-undef,functional/immutable-data
        .then(async () => {
          const [modelName, obj] = await _getDbEntryInfo<T, TModel>(instance)
          if (!(modelName in db)) {
            // eslint-disable-next-line functional/immutable-data
            db[modelName] = {}
          }
          const primaryKey = instance.getModel().getPrimaryKeyName()
          // @ts-ignore
          // eslint-disable-next-line functional/immutable-data
          db[modelName][obj[primaryKey]] = obj
          return obj as ModelInstanceInputData<T>
        })
    )
  }

  const deleteObj = <T extends FunctionalModel, TModel extends Model<T>>(
    instance: ModelInstance<T, TModel>
  ) => {
    return (
      Promise.resolve()
        // eslint-disable-next-line no-undef,functional/immutable-data
        .then(async () => {
          const [modelName, obj] = await _getDbEntryInfo(instance)
          // eslint-disable-next-line no-undef,functional/immutable-data
          if (obj) {
            const primaryKey = instance.getModel().getPrimaryKeyName()
            // @ts-ignore
            // eslint-disable-next-line functional/immutable-data
            delete db[modelName][obj[primaryKey]]
          }
        })
    )
  }

  const retrieve = <T extends FunctionalModel>(
    model: Model<T>,
    primaryKey: PrimaryKeyType
  ) => {
    return Promise.resolve().then(() => {
      const modelName = model.getName()
      const key = `${modelName}.${primaryKey}`
      const x = get(db, key, undefined)
      if (!x) {
        return undefined
      }
      // @ts-ignore
      return x as ModelInstanceInputData<T, any>
    })
  }

  const _equalitySymbolToOperation: {
    // eslint-disable-next-line functional/prefer-readonly-type
    [s: string]: (name: string, value: any) => (obj: SimpleObj) => boolean
  } = {
    '=': (name, value) => obj => value === obj[name],
    '>=': (name, value) => obj => obj[name] >= value,
    '>': (name, value) => obj => obj[name] > value,
    '<=': (name, value) => obj => obj[name] <= value,
    '<': (name, value) => obj => obj[name] < value,
  }

  const search = <T extends FunctionalModel, TModel extends Model<T>>(
    model: TModel,
    ormQuery: OrmQuery
  ): Promise<DatastoreSearchResult<T>> => {
    return Promise.resolve().then(() => {
      const modelName = model.getName()
      const propertyQueries = ormQuery.properties || {}
      const searches = Object.values(propertyQueries).map(partial => {
        if (partial.valueType === 'string' || !partial.valueType) {
          const flag = partial.options.caseSensitive ? '' : 'i'
          const value = partial.options.startsWith
            ? `^${partial.value}`
            : partial.options.endsWith
            ? `${partial.value}$`
            : `^${partial.value}$`
          const reg = new RegExp(value, flag)
          return (obj: SimpleObj) => reg.test(obj[partial.name])
        } else if (partial.valueType === 'number') {
          const symbol = partial.options.equalitySymbol
          if (!symbol) {
            throw new Error(`No symbol provided!`)
          }
          const operation = _equalitySymbolToOperation[symbol]
          if (!operation) {
            throw new Error(`Symbol ${symbol} is not supported`)
          }
          return operation(partial.name, partial.value)
        }
        return () => undefined
      })
      if (!(modelName in db)) {
        return {
          instances: [],
          page: null,
        }
      }
      type ValidationFunc = (obj: SimpleObj) => boolean
      const models = db[modelName] as {
        // eslint-disable-next-line functional/prefer-readonly-type
        [s: PrimaryKeyType]: readonly ModelInstanceInputData<T>[]
      }
      const beforeFilters = Object.entries(
        ormQuery.datesBefore ||
          ({} as { readonly [s: string]: DatesBeforeStatement })
      ).reduce((acc, [key, partial]) => {
        const func = (theirObj: SimpleObj) => {
          // @ts-ignore
          const asDate = new Date(theirObj[key])
          const thisDate = new Date(partial.date)
          const before = isBefore(asDate, thisDate)
          return partial.options.equalToAndBefore
            ? before || isEqual(asDate, thisDate)
            : before
        }
        return [...acc, func]
      }, [] as readonly ValidationFunc[])
      const afterFilters = Object.entries(ormQuery.datesAfter || {}).reduce(
        (acc, [key, partial]) => {
          return [
            ...acc,
            (theirObj: SimpleObj) => {
              // @ts-ignore
              const asDate = new Date(theirObj[key])
              const thisDate = new Date(partial.date)
              const after = isAfter(asDate, thisDate)
              return partial.options.equalToAndAfter
                ? after || isEqual(asDate, thisDate)
                : after
            },
          ]
        },
        [] as readonly ValidationFunc[]
      )
      const results = flatten(values(models)).filter(obj => {
        if (searches.length > 0) {
          const match = searches.find(method => method(obj as SimpleObj))
          if (!match) {
            return false
          }
        }
        const beforeMatched =
          beforeFilters.length > 0
            ? beforeFilters.every(method => method(obj as SimpleObj))
            : true
        if (!beforeMatched) {
          return false
        }
        const afterMatched =
          afterFilters.length > 0
            ? afterFilters.every(method => method(obj as SimpleObj))
            : true
        if (!afterMatched) {
          return false
        }
        return true
      })
      const instances = ormQuery.take
        ? results.slice(0, ormQuery.take)
        : results
      const sorted: readonly ModelInstanceInputData<T>[] = ormQuery.sort
        ? orderBy(
            instances,
            [ormQuery.sort.key],
            [ormQuery.sort.order ? 'asc' : 'desc']
          )
        : instances

      return {
        instances: sorted,
        page: null,
      }
    })
  }

  return {
    search,
    retrieve,
    save,
    delete: deleteObj,
  }
}

export default memoryDatastoreProvider
