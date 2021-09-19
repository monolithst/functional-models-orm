const merge = require('lodash/merge')
const pickBy = require('lodash/pickBy')
const values = require('lodash/values')
const get = require('lodash/get')

const memoryDatastoreProvider = (seedModelsByModelName ={}) => {
  const db = Object.entries(seedModelsByModelName)
    .reduce((acc, [modelName, models]) => {
      const data = models.reduce((inner, model) => {
        return {...inner, [model.id]: model}
      }, {})
      return merge({}, acc, { [modelName]: data })
    }, {})


  const save = (tableName, modelName, obj) => {
    return Promise.resolve()
      // eslint-disable-next-line no-undef,functional/immutable-data
      .then(() => { 
        if (!(modelName in db)) {
          db[modelName] = {}
        }
        db[modelName][obj.id] = obj 
      })
  }

  const deleteObj = (tableName, modelName, obj) => {
    return Promise.resolve()
      // eslint-disable-next-line no-undef,functional/immutable-data
      .then(() => { 
        delete db[modelName][obj.id]
      })
  }

  const retrieve = (tableName, modelName, id) => {
    return Promise.resolve()
      .then(() => {
        const key = `${modelName}.${id}`
        return get(db, key, undefined)
      })
  }

  const search = (tableName, modelName, ormQuery) => {
    return Promise.resolve()
      .then(() => {
        const fieldQueries = ormQuery.fields
        const insensitiveQueries = values(pickBy(fieldQueries, (value, key) => value.options.caseSensitive === false))
        const caseSensitiveQueries = values(pickBy(fieldQueries, (value, key) => value.options.caseSensitive === true))
        if (!(modelName in db)) {
          return []
        }
        const models = db[modelName]
        return values(pickBy(models,
          (obj, id) => {
            if (insensitiveQueries.find(i => 
              i.value.localeCompare(obj[i.name], undefined, { sensitivity: 'accent' }) === 0)) {
              return true
            }
            if (caseSensitiveQueries.find(i => i.value === obj[i.name]) === 0) {
              return true
            }
            return false
          }))
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
