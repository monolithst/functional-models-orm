const merge = require('lodash/merge')
const pickBy = require('lodash/pickBy')
const values = require('lodash/values')
const get = require('lodash/get')

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

  const search = (model, ormQuery) => {
    return Promise.resolve().then(() => {
      const modelName = model.getName()
      const propertyQueries = ormQuery.properties
      const insensitiveQueries = values(
        pickBy(
          propertyQueries,
          (value, _) => value.options.caseSensitive === false
        )
      )
      const caseSensitiveQueries = values(
        pickBy(
          propertyQueries,
          (value, _) => value.options.caseSensitive === true
        )
      )
      if (!(modelName in db)) {
        return {
          instances: [],
          page: null,
        }
      }
      const models = db[modelName]
      const results = values(
        pickBy(models, (obj, _) => {
          if (
            insensitiveQueries.find(
              i =>
                i.value.localeCompare(obj[i.name], undefined, {
                  sensitivity: 'accent',
                }) === 0
            )
          ) {
            return true
          }
          if (caseSensitiveQueries.find(i => i.value === obj[i.name]) === 0) {
            return true
          }
          return false
        })
      )
      return {
        instances: results,
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
