const merge = require('lodash/merge')
const identity = require('lodash/identity')
const { DateProperty } = require('functional-models')
const { unique, uniqueTogether } = require('./validation')

const _defaultPropertyConfig = {
  unique: false,
  uniqueTogether: null,
}

const LastModifiedDateProperty = config => {
  const additionalMetadata = { lastModifiedUpdateMethod: () => new Date() }
  return DateProperty(config, additionalMetadata)
}

const ormPropertyConfig = (config = _defaultPropertyConfig) => {
  return merge(config, {
    validators: [
      ...(config.validators ? config.validators : []),
      config.unique ? unique(config.unique) : null,
      config.uniqueTogether ? uniqueTogether(config.uniqueTogether) : null,
    ].filter(identity),
  })
}

module.exports = {
  ormPropertyConfig,
  LastModifiedDateProperty,
}
