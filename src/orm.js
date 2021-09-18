const get = require('lodash/get')
const merge = require('lodash/merge')

const {
  createModel: originalCreateModel
} = require('functional-models')

const _getDefaultModelName = (modelName) => {
  return modelName.toLowerCase().replace(' ', '-').replace('_', '-')
}

const _getOrmModelProperties = (modelName, keyToProperty) => {
  const tableName = get(keyToProperty, 'meta.tableName', _getDefaultModelName(modelName))
  return {
    ormSettings: {
      tableName,
    }
  }
}


const orm = ({ datastoreProvider }) => {

  const createModel = (modelName, keyToProperty, additionalModelProperties) => {
    /*
    NOTE: We need access to the model AFTER its built, so we have to have this state variable.
    It has been intentionally decided that recreating the model each and everytime for each database retrieve is
    too much cost to obtain "functional purity". This could always be reverted back.
    */
    let model = null

    const ormModelProperties = _getOrmModelProperties(modelName, keyToProperty)
    const _retrievedObjToModel = (obj) => {
      const data = merge(
        obj,
        {
          meta: {
            dirty: false
          }
        })
      return model(data)
    }

    const retrieve = async (id) => {
      const tableName = ormModelProperties.ormSettings.tableName
      const obj = await datastoreProvider.retrieve(tableName, modelName, id)
      return _retrievedObjToModel(obj)
    }

    const search = (ormQuery) => {
      const tableName = ormModelProperties.ormSettings.tableName
      return datastoreProvider.search(tableName, modelName, ormQuery)
        .then(results => results.map(_retrievedObjToModel))
    }

    const modelProperties = merge({}, additionalModelProperties, {
      retrieve,
      search,
    })
    const instanceProperties = {
      meta: {
        dirty: true
      },
    }
    const newKeyToProperty = merge(
      {},
      keyToProperty,
      instanceProperties
    )
    const callBacks = {
      instanceCreatedCallback: (instance) => {
        const save = async () => {
          const tableName = ormModelProperties.ormSettings.tableName
          if (instance.functions.validate.model().length > 0) {
            throw new Error(`Cannot save model. Validation errors exist.`)
          }
          const obj = instance.functions.toObj()
          await datastoreProvider.save(tableName, modelName, obj)
          return _retrievedObjToModel(obj)
        }
        // eslint-disable-next-line functional/immutable-data
        instance.functions.save = save
      }
    }
    model = originalCreateModel(modelName, newKeyToProperty, modelProperties, callBacks)
    return merge(
      {},
      model,
    )
  }

  return {
    createModel,
  }
}

module.exports = orm
