const flow = require('lodash/flow')
const ormQuery = require('./ormQuery')

const _doUniqueCheck = async (
  query,
  instance,
  instanceData,
  buildErrorMessage
) => {
  const model = instance.meta.getModel()
  const results = await model.search(query)
  const resultsLength = results.instances.length
  // There is nothing stored with this value.
  if (resultsLength < 1) {
    return undefined
  }
  const ids = await Promise.all(
    results.instances.map(x => x.functions.getPrimaryKey())
  )
  // We have our match by id.
  const instanceId = instanceData[model.getPrimaryKeyName()]
  if (ids.length === 1 && ids[0] === instanceId) {
    return undefined
  }
  if (ids.length > 1) {
    // This is a weird but possible case where there is more than one item. We don't want to error
    // if the instance we are checking is already in the datastore.
    if (ids.find(x => x === instanceId)) {
      return undefined
    }
  }
  return buildErrorMessage()
}

const uniqueTogether = propertyKeyArray => {
  const _uniqueTogether = async (instance, instanceData) => {
    const properties = propertyKeyArray.map(key => {
      return [key, instanceData[key]]
    })
    const query = flow(
      properties.map(([key, value]) => {
        return b => {
          return b.property(key, value, { caseSensitive: false }).and()
        }
      })
    )(ormQuery.ormQueryBuilder()).compile()
    return _doUniqueCheck(query, instance, instanceData, () => {
      return propertyKeyArray.length > 1
        ? `${propertyKeyArray.join(
            ','
          )} must be unique together. Another instance found.`
        : `${propertyKeyArray[0]} must be unique. Another instance found.`
    })
  }
  return _uniqueTogether
}

const unique = propertyKey => {
  const _unique = async (value, instance, instanceData) => {
    return uniqueTogether([propertyKey])(instance, instanceData)
  }
  return _unique
}

module.exports = {
  unique,
  uniqueTogether,
}
