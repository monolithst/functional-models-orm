import flow from 'lodash/flow'
import {
  PropertyValidatorComponentAsync,
  DataDescription,
  PrimaryKeyType,
  ComponentValidationErrorResponse,
  JsonAble,
  ModelValidatorComponent,
} from 'functional-models'
import {builderV2, take} from './ormQuery'
import {
  SearchQuery,
  OrmValidatorContext,
  OrmModelInstance,
  OrmModelExtensions,
  OrmModelInstanceExtensions,
} from './types'

const _doUniqueCheck = async <T extends DataDescription>(
  query: SearchQuery,
  instance: OrmModelInstance<T>,
  instanceData: T | JsonAble,
  buildErrorMessage: () => ComponentValidationErrorResponse
): Promise<ComponentValidationErrorResponse> => {
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
  // @ts-ignore
  const instanceId = instanceData[model.getModelDefinition().primaryKeyName]
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

const uniqueTogether = <T extends DataDescription>(
  propertyKeyArray: readonly string[]
): ModelValidatorComponent<
  T,
  OrmModelExtensions,
  OrmModelInstanceExtensions
> => {
  const _uniqueTogether = async (
    instance: OrmModelInstance<T>,
    instanceData: T | JsonAble,
    options: OrmValidatorContext
  ) => {
    if (options.noOrmValidation) {
      return undefined
    }
    const properties = propertyKeyArray.map(key => {
      // @ts-ignore
      return [key, instanceData[key]]
    })
    const query = flow(
      properties.map(([key, value], index) => {
        return b => {
          // We only want to do an 'and' if there is another property.
          if (index + 1 >= properties.length) {
            return b.property(key, value, { caseSensitive: false })
          }
          return b.property(key, value, { caseSensitive: false }).and()
        }
      })
    )(builderV2({
      take: take(2),
      query: []
    })).compile()
    return _doUniqueCheck<T>(query, instance, instanceData, () => {
      return propertyKeyArray.length > 1
        ? `${propertyKeyArray.join(
            ','
          )} must be unique together. Another instance found.`
        : `${propertyKeyArray[0]} must be unique. Another instance found.`
    })
  }
  return _uniqueTogether
}

const unique = <T extends DataDescription>(
  propertyKey: string
): PropertyValidatorComponentAsync<
  T,
  OrmModelExtensions,
  OrmModelInstanceExtensions
> => {
  const _unique: PropertyValidatorComponentAsync<
    T,
    OrmModelExtensions,
    OrmModelInstanceExtensions
  > = (value, instance, instanceData, options) => {
    return uniqueTogether<T>([propertyKey])(instance, instanceData, options)
  }
  return _unique
}

const buildOrmValidatorContext = ({
  noOrmValidation = false,
}): OrmValidatorContext => ({
  noOrmValidation,
})

export { unique, uniqueTogether, buildOrmValidatorContext }
