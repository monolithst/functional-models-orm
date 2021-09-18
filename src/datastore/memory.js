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


  const save = (tableName, modelName, obj) => () => {
    return Promise.resolve()
      // eslint-disable-next-line no-undef,functional/immutable-data
      .then(() => { db[modelName][obj.id] = obj })
  }

  const retrieve = (tableName, modelName, id) => {
    return Promise.resolve()
      .then(() => {
        return get(db, `${modelName}.[${id}]`, undefined)
      })
  }

  const search = (tableName, modelName, ormQuery) => {
    return Promise.resolves()
      .then(() => {
        const fieldQueries = ormQuery.fields
        const insensitiveQueries = values(pickBy(fieldQueries, ([value, key]) => value.caseInsensitive === true))
        const caseSensitiveQueries = values(pickBy(fieldQueries, ([value, key]) => value.caseInsensitive === true))
        return db[modelName]
          .pickBy(([obj, id]) => {
            if (insensitiveQueries.find(i => i.value.localeCompare(obj[i.name], undefined, { sensitivity: 'accent' }))) {
              return true
            }
            if (caseSensitiveQueries.find(i => i.value === obj[i.name])) {
              return true
            }
            return false
          })
      })
  }

  return {
    search,
    retrieve,
    save,
  }
}

module.exports = memoryDatastoreProvider
