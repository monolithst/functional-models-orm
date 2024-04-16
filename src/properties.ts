import merge from 'lodash/merge'
import identity from 'lodash/identity'
import { AdvancedModelReferenceProperty, DateProperty } from 'functional-models'
import {
  PropertyConfig,
  Maybe,
  Arrayable,
  FunctionalValue,
  FunctionalModel,
  ModelReference,
  PropertyModifier,
} from 'functional-models/interfaces'

import { unique, uniqueTogether } from './validation'
import { OrmModel, OrmPropertyConfig } from './interfaces'

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

const OrmModelReferenceProperty = <
  T extends FunctionalModel,
  TModifier extends PropertyModifier<ModelReference<T>> = PropertyModifier<
    ModelReference<T>
  >,
>(
  model: OrmModel<T>,
  config?: PropertyConfig<TModifier>
) => AdvancedModelReferenceProperty<T>(model as any, config as any)

const ormPropertyConfig = <T extends Arrayable<FunctionalValue>>(
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
