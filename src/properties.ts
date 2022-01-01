import merge from 'lodash/merge'
import identity from 'lodash/identity'
import { AdvancedModelReferenceProperty, DateProperty } from 'functional-models'
import {
  PropertyConfig,
  Maybe,
  Arrayable,
  FunctionalValue,
  FunctionalModel,
} from 'functional-models/interfaces'

import { unique, uniqueTogether } from './validation'
import {
  OrmModel,
  OrmModelInstance,
  OrmPropertyConfig,
  OrmModelReference,
} from './interfaces'

const _defaultPropertyConfig = {
  unique: undefined,
  uniqueTogether: undefined,
}

const LastModifiedDateProperty = (
  config: PropertyConfig<Maybe<string | Date>> = {}
) => {
  const additionalMetadata = { lastModifiedUpdateMethod: () => new Date() }
  return DateProperty(config, additionalMetadata)
}

const OrmModelReferenceProperty = <T extends FunctionalModel>(
  model: OrmModel<T>,
  config?: PropertyConfig<OrmModelReference<T>>
) =>
  AdvancedModelReferenceProperty<
    T,
    OrmModel<T>,
    OrmModelInstance<T, OrmModel<T>>,
    OrmModelReference<T>
  >(model, config)

const ormPropertyConfig = <T extends Arrayable<FunctionalValue>>(
  config: OrmPropertyConfig<T> = _defaultPropertyConfig
) => {
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
