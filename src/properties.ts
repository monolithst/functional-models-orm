import merge from 'lodash/merge'
import identity from 'lodash/identity'
import {
  AdvancedModelReferenceProperty,
  DatetimeProperty,
  DateValueType,
  PropertyConfig,
  Arrayable,
  DataValue,
  DataDescription,
  ModelReferenceType,
} from 'functional-models'

import { unique, uniqueTogether } from './validation'
import {
  OrmModel,
  OrmModelExtensions,
  OrmModelInstanceExtensions,
  OrmPropertyConfig,
} from './types'

const _defaultPropertyConfig = {
  unique: undefined,
  uniqueTogether: undefined,
}

const LastModifiedDateProperty = (
  config: PropertyConfig<DateValueType> = {}
) => {
  const additionalMetadata = { lastModifiedUpdateMethod: () => new Date() }
  return DatetimeProperty(config, additionalMetadata)
}

const OrmModelReferenceProperty = <
  T extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
>(
  model: OrmModel<T, TModelExtensions, TModelInstanceExtensions>,
  config?: PropertyConfig<ModelReferenceType<any>>
) =>
  AdvancedModelReferenceProperty<
    T,
    OrmModelExtensions<TModelExtensions, TModelInstanceExtensions>,
    OrmModelInstanceExtensions<TModelExtensions, TModelInstanceExtensions>
  >(model, config)

const ormPropertyConfig = <T extends Arrayable<DataValue>>(
  config: OrmPropertyConfig<T> = _defaultPropertyConfig
): PropertyConfig<T> => {
  return merge(config, {
    validators: [
      ...(config.validators ? config.validators : []),
      config.unique ? unique(config.unique) : null,
      config.uniqueTogether ? uniqueTogether(config.uniqueTogether) : null,
    ].filter(identity),
  })
}

export {
  ormPropertyConfig,
  LastModifiedDateProperty,
  OrmModelReferenceProperty,
}
