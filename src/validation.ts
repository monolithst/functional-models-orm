import flow from 'lodash/flow'
import {
  ModelValidatorComponent,
  PropertyValidatorComponentAsync,
  FunctionalModel,
  PrimaryKeyType,
  ModelError,
  JsonAble,
  ModelInstance,
} from 'functional-models/interfaces'
import { ormQueryBuilder } from './ormQuery'
import { OrmQuery, OrmValidatorConfiguration } from './interfaces'

const _doUniqueCheck = async (
  query: OrmQuery,
  instance: any,
  instanceData: any,
  buildErrorMessage: () => ModelError
): Promise<ModelError> => {
  const model = instance.getModel()
  const results = await model.search(query)
  const resultsLength = results.instances.length
  // There is nothing stored with this value.
  if (resultsLength < 1) {
    return undefined
  }
  const ids: readonly PrimaryKeyType[] = await Promise.all(
    results.instances.map((x: any) => x.getPrimaryKey())
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

const uniqueTogether = <T extends FunctionalModel>(
  propertyKeyArray: readonly string[]
) => {
  const _uniqueTogether = async (
    instance: ModelInstance<T>,
    instanceData: T | JsonAble,
    options: OrmValidatorConfiguration = buildOrmValidationOptions({})
  ) => {
    if (options.noOrmValidation) {
      return undefined
    }
    const properties = propertyKeyArray.map(key => {
      // @ts-ignore
      return [key, instanceData[key]]
    })
    const query = flow(
      properties.map(([key, value]) => {
        return b => {
          return b.property(key, value, { caseSensitive: false }).and()
        }
      })
    )(ormQueryBuilder())
      .take(2)
      .compile()
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

const unique = <T extends FunctionalModel>(
  propertyKey: string
): PropertyValidatorComponentAsync<T> => {
  const _unique: PropertyValidatorComponentAsync<T> = (
    value,
    instance,
    instanceData,
    options
  ) => {
    return uniqueTogether<T>([propertyKey])(instance, instanceData, options)
  }
  //const _unique = async (value: string, instance: any, instanceData: any, options: {noOrmValidation: boolean}) => {
  //}
  return _unique
}

const buildOrmValidationOptions = ({
  noOrmValidation = false,
}): OrmValidatorConfiguration => ({
  noOrmValidation,
})

export { unique, uniqueTogether, buildOrmValidationOptions }
