const flow = require('lodash/flow')
const ormQuery = require('./ormQuery')

const _doUniqueCheck = async (query, instance, instanceData, buildErrorMessage) => {
  const model = instance.meta.getModel()
  const results = await model.search(query)
  const resultsLength = results.instances.length
  // There is nothing stored with this value.
  if (resultsLength < 1) {
    return undefined
  }
  // We have our match by id.
  if (resultsLength === 1 && results.instances[0].id === instanceData.id) {
    return undefined
  }
  if (resultsLength > 1) {
    // This is a weird but possible case where there is more than one item. We don't want to error
    // if the instance we are checking is already in the datastore.
    if (results.instances.find(x=>x.id === instanceData.id)) {
      return undefined
    }
  }
  return buildErrorMessage()
}

const uniqueTogether = (propertyKeyArray) => async (instance, instanceData) => {
  const properties = propertyKeyArray.map(key => {
    return [key, instanceData[key]]
  })
  const query = flow(
    properties.map(([key, value]) => {
      return b => {
        return b
          .property(key, value, { caseSensitive: false})
          .and()
      }
    })
  )(ormQuery.ormQueryBuilder()).compile()
  return _doUniqueCheck(query, instance, instanceData, () => {
    return `${propertyKeyArray.join(',')} must be unique together. Another instance found.`
  })
}

const unique = (propertyKey) => async (instance, instanceData) => {
  return uniqueTogether([propertyKey])(instance, instanceData)
}


module.exports = {
  unique,
  uniqueTogether,
}