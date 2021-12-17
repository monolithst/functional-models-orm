import flow from 'lodash/flow'
import { ormQueryBuilder } from './ormQuery'
import { OrmQuery } from './interfaces'

const _doUniqueCheck = async (
  query: OrmQuery,
  instance: any,
  instanceData: any,
  buildErrorMessage: () => string
) => {
  const model = instance.meta.getModel()
  const results = await model.search(query)
  const resultsLength = results.instances.length
  // There is nothing stored with this value.
  if (resultsLength < 1) {
    return undefined
  }
  const ids : any[] = await Promise.all(
    results.instances.map((x: any) => x.functions.getPrimaryKey())
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

const uniqueTogether = (propertyKeyArray: readonly string[]) => {
  const _uniqueTogether = async (instance: any, instanceData: any, options=buildOrmValidationOptions({})) => {
    if (options.noOrmValidation) {
      return undefined
    }
    const properties = propertyKeyArray.map(key => {
      return [key, instanceData[key]]
    })
    const query = flow(
      properties.map(([key, value]) => {
        return b => {
          return b.property(key, value, { caseSensitive: false }).and()
        }
      })
    )(ormQueryBuilder()).compile()
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

const unique = (propertyKey: string) => {
  const _unique = async (value: string, instance: any, instanceData: any, options: {noOrmValidation: boolean}) => {
    return uniqueTogether([propertyKey])(instance, instanceData, options)
  }
  return _unique
}

const buildOrmValidationOptions = ({
  noOrmValidation=false
}) => ({
  noOrmValidation,
})

export {
  unique,
  uniqueTogether,
  buildOrmValidationOptions,
}
