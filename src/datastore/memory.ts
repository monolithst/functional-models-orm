import merge from 'lodash/merge'
import values from 'lodash/values'
import flatten from 'lodash/flatten'
import get from 'lodash/get'
import orderBy from 'lodash/orderBy'
/* eslint-disable import/no-duplicates */
import { isBefore } from 'date-fns/isBefore'
import { isAfter } from 'date-fns/isAfter'
import { isEqual } from 'date-fns/isEqual'
/* eslint-enable import/no-duplicates */
import {
  FunctionalModel,
  JsonAble,
  Model,
  ModelInstance,
  PrimaryKeyType,
  TypedJsonObj,
} from 'functional-models/interfaces'
import { createBooleanChains } from '../ormQuery'
import {
  DatastoreProvider,
  OrmQuery,
  DatesBeforeStatement,
  DatastoreSearchResult,
  PropertyStatement,
} from '../interfaces'

const _getDbEntryInfo = async <
  T extends FunctionalModel,
  TModel extends Model<T>,
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
  [s: ModelType]: readonly TypedJsonObj<any>[]
}

type ModelsDb = {
  // eslint-disable-next-line functional/prefer-readonly-type
  [s: ModelType]: {
    // eslint-disable-next-line functional/prefer-readonly-type
    [s: PrimaryKeyType]: readonly TypedJsonObj<any>[]
  }
}

type SimpleObj = {
  // eslint-disable-next-line functional/prefer-readonly-type
  [s: string]: any
}

type MemoryDatastoreProviderProps = Readonly<{
  getSeedPrimaryKeyName?: () => string
  onDbChanged: (db: ModelsDb) => void
}>

const memoryDatastoreProvider = (
  seedModelsByModelName: SeedModels = {},
  {
    getSeedPrimaryKeyName = () => 'id',
    onDbChanged = () => undefined,
  }: MemoryDatastoreProviderProps = {
    getSeedPrimaryKeyName: () => 'id',
    onDbChanged: () => undefined,
  }
): DatastoreProvider => {
  if (!getSeedPrimaryKeyName) {
    throw new Error(`Configuration must include getSeedPrimaryKey.`)
  }
  const db: ModelsDb = Object.entries(seedModelsByModelName).reduce(
    (acc, [modelName, models]) => {
      const data = models.reduce((inner, model) => {
        return {
          ...(inner as object),
          // @ts-ignore
          [model[getSeedPrimaryKeyName(model)]]: model,
        }
      }, {})
      return merge({}, acc, { [modelName]: data })
    },
    {}
  )

  const save = <T extends FunctionalModel, TModel extends Model<T>>(
    instance: ModelInstance<T, TModel>
  ): Promise<TypedJsonObj<T>> => {
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
          if (onDbChanged) {
            onDbChanged(db)
          }
          return obj as TypedJsonObj<T>
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
            if (onDbChanged) {
              onDbChanged(db)
            }
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
      return x as TypedJsonObj<T, any>
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
      if (!(modelName in db)) {
        return {
          instances: [],
          page: null,
        }
      }
      const chains = createBooleanChains(ormQuery)
      type ValidationFunc = (obj: SimpleObj) => boolean
      const models = db[modelName] as {
        // eslint-disable-next-line functional/prefer-readonly-type
        [s: PrimaryKeyType]: readonly TypedJsonObj<T>[]
      }
      const beforeFilters = Object.entries(
        ormQuery.datesBefore ||
          ({} as Readonly<{ [s: string]: DatesBeforeStatement }>)
      ).reduce(
        (acc, [key, partial]) => {
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
        },
        [] as readonly ValidationFunc[]
      )
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

      const _propertyMatch = (partial: PropertyStatement) => {
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
        return () => false
      }

      const andSearches = chains.ands.reduce(
        (acc, s) => {
          if (s.type !== 'property') {
            return acc
          }
          return acc.concat(_propertyMatch(s))
        },
        [] as ((obj: SimpleObj) => boolean)[]
      )

      const orSearches = chains.orChains.reduce(
        (acc, s) => {
          return acc.concat((obj: SimpleObj) => {
            return s.some(inside => _propertyMatch(inside)(obj))
          })
        },
        [] as ((obj: SimpleObj) => boolean)[]
      )

      const andSearch = (o: SimpleObj) => {
        return andSearches.every(a => a(o))
      }

      const orSearch = (o: SimpleObj) => {
        return orSearches.some(a => a(o))
      }

      const justPropertyQuery = (o: SimpleObj) => {
        // Sometimes we have no chain but have properties. This is a legacy hack.
        if (andSearches.length < 1 && orSearches.length < 1) {
          return Object.entries(ormQuery.properties)
            .map(([k, v]) => _propertyMatch(v))
            .every(x => x(o))
        }
        // Ignore this entirely
        return true
      }

      const results = flatten(values(models)).filter(obj => {
        if (andSearches.length > 0) {
          if (!andSearch(obj)) {
            return false
          }
        }
        if (orSearches.length > 0) {
          if (!orSearch(obj)) {
            return false
          }
        }
        if (!justPropertyQuery(obj)) {
          return false
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
      const sorted: readonly TypedJsonObj<T>[] = ormQuery.sort
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
