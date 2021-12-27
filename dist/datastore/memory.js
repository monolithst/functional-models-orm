const merge = require('lodash/merge')
const values = require('lodash/values')
const get = require('lodash/get')
const orderBy = require('lodash/orderBy')
const isBefore = require('date-fns/isBefore')
const isAfter = require('date-fns/isAfter')
const isEqual = require('date-fns/isEqual')

const _getDbEntryInfo = async instance => {
  const modelName = instance.meta.getModel().getName()
  const obj = await instance.functions.toObj()
  return [modelName, obj]
}

const memoryDatastoreProvider = (
  seedModelsByModelName = {},
  { primaryKey = 'id' } = {}
) => {
  if (!primaryKey) {
    throw new Error(`Configuration must include primary key.`)
  }
  const db = Object.entries(seedModelsByModelName).reduce(
    (acc, [modelName, models]) => {
      const data = models.reduce((inner, model) => {
        return { ...inner, [model[primaryKey]]: model }
      }, {})
      return merge({}, acc, { [modelName]: data })
    },
    {}
  )

  const save = instance => {
    return (
      Promise.resolve()
        // eslint-disable-next-line no-undef,functional/immutable-data
        .then(async () => {
          const [modelName, obj] = await _getDbEntryInfo(instance)
          if (!(modelName in db)) {
            // eslint-disable-next-line functional/immutable-data
            db[modelName] = {}
          }
          // eslint-disable-next-line functional/immutable-data
          db[modelName][obj[primaryKey]] = obj
          return obj
        })
    )
  }

  const deleteObj = instance => {
    return (
      Promise.resolve()
        // eslint-disable-next-line no-undef,functional/immutable-data
        .then(async () => {
          const [modelName, obj] = await _getDbEntryInfo(instance)
          // eslint-disable-next-line no-undef,functional/immutable-data
          delete db[modelName][obj[primaryKey]]
        })
    )
  }

  const retrieve = (model, id) => {
    const modelName = model.getName()
    return Promise.resolve().then(() => {
      const key = `${modelName}.${id}`
      return get(db, key, undefined)
    })
  }

  const _equalitySymbolToOperation = {
    '=': (name, value) => (obj) => value === obj[name],
    '>=': (name, value) => (obj) => obj[name] >= value,
    '>': (name, value) => (obj) => obj[name] > value,
    '<=': (name, value) => (obj) => obj[name] <= value,
    '<': (name, value) => (obj) => obj[name] < value,
  }

  const search = (model, ormQuery) => {
    return Promise.resolve().then(() => {
      const modelName = model.getName()
      const propertyQueries = ormQuery.properties || {}
      const searches = Object.values(propertyQueries)
        .map(partial => {
          if (partial.options.type === 'string' || !partial.options.type) {
            const flag = partial.options.caseSensitive ? '' : 'i'
            const value = partial.options.startsWith
              ? `^${partial.value}`
              : partial.options.endsWith
                ? `${partial.value}$`
                : `^${partial.value}$`
            const reg = new RegExp(value, flag)
            return (obj) => reg.test(obj[partial.name])
          } else if (partial.options.type === 'number') {
            const symbol = partial.options.equalitySymbol
            if (!symbol){
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
      const models = db[modelName]
      const beforeFilters = Object.entries(ormQuery.datesBefore || {})
        .reduce((acc, [key, partial]) => {
          return [...acc, (theirObj) => {
            const asDate = new Date(theirObj[key])
            const thisDate = new Date(partial.date)
            const before = isBefore(asDate, thisDate)
            return partial.options.equalToAndBefore
              ? before || isEqual(asDate, thisDate)
              : before
          }]
        }, [])
      const afterFilters = Object.entries(ormQuery.datesAfter || {})
        .reduce((acc, [key, partial]) => {
          return [...acc, (theirObj) => {
            const asDate = new Date(theirObj[key])
            const thisDate = new Date(partial.date)
            const after = isAfter(asDate, thisDate)
            return partial.options.equalToAndAfter
              ? after || isEqual(asDate, thisDate)
              : after
          }]
        }, [])
      const results = values(models)
        .filter(obj => {
          if (searches.length > 0) {
            const match = searches.find(method => method(obj))
            if (!match) {
              return false
            }
          }
          const beforeMatched = beforeFilters.length > 0
            ? beforeFilters.every(method=> method(obj))
            : true
          if (!beforeMatched) {
            return false
          }
          const afterMatched = afterFilters.length > 0
            ? afterFilters.every(method=> method(obj))
            : true
          if (!afterMatched) {
            return false
          }
          return true
        })
      const instances = ormQuery.take
        ? results.slice(0, ormQuery.take)
        : results
      const sorted = ormQuery.sort
        ? orderBy(instances, [ormQuery.sort.key], [ormQuery.sort.order ? 'asc' : 'desc'])
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

module.exports = memoryDatastoreProvider
