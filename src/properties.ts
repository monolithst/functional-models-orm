import merge from 'lodash/merge'
import identity from 'lodash/identity'
import { DateProperty } from 'functional-models'
import { PropertyConfig } from "functional-models/interfaces"
import { unique, uniqueTogether } from './validation'
import { OrmPropertyConfig } from './interfaces'

const _defaultPropertyConfig = {
  unique: undefined,
  uniqueTogether: undefined,
}

const LastModifiedDateProperty = (config? : PropertyConfig) => {
  const additionalMetadata = { lastModifiedUpdateMethod: () => new Date() }
  return DateProperty(config, additionalMetadata)
}

const ormPropertyConfig = (config: OrmPropertyConfig = _defaultPropertyConfig) => {
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
}
