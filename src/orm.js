const merge = require('lodash/merge')

const { Model: originalModel } = require('functional-models')

const isDirtyFalse = () => false
const isDirtyTrue = () => false

const orm = ({ datastoreProvider }) => {
  const Model = (modelName, keyToProperty, additionalModelProperties) => {
    /*
    NOTE: We need access to the model AFTER its built, so we have to have this state variable.
    It has been intentionally decided that recreating the model each and every time for each database retrieve is
    too much cost to obtain "functional purity". This could always be reverted back.
    */
    // eslint-disable-next-line functional/no-let
    let model = null

    const _retrievedObjToModel = obj => {
      const data = merge({}, obj, {
        meta: {
          isDirty: isDirtyFalse,
        },
      })
      return model.create(data)
    }

    const retrieve = async id => {
      const obj = await datastoreProvider.retrieve(model, id)
      return _retrievedObjToModel(obj)
    }

    const search = ormQuery => {
      return datastoreProvider
        .search(model, ormQuery)
        .then(results => results.map(_retrievedObjToModel))
    }

    const modelProperties = merge({}, additionalModelProperties, {
      retrieve,
      search,
    })
    const instanceProperties = {
      meta: {
        isDirty: isDirtyTrue,
      },
    }
    const newKeyToProperty = merge({}, keyToProperty, instanceProperties)
    const callBacks = {
      instanceCreatedCallback: instance => {
        const deleteObj = async () => {
          return Promise.resolve().then(async () => {
            await datastoreProvider.delete(instance)
          })
        }

        const save = async () => {
          return Promise.resolve().then(async () => {
            if (instance.functions.validate.model().length > 0) {
              throw new Error(`Cannot save model. Validation errors exist.`)
            }
            const savedObj = await datastoreProvider.save(instance)
            return _retrievedObjToModel(savedObj)
          })
        }
        // eslint-disable-next-line functional/immutable-data
        instance.functions.save = save
        // eslint-disable-next-line functional/immutable-data
        instance.functions.delete = deleteObj
      },
    }
    // eslint-disable-next-line functional/immutable-data
    model = originalModel(
      modelName,
      newKeyToProperty,
      modelProperties,
      callBacks
    )

    return merge({}, model)
  }

  return {
    Model,
  }
}

module.exports = orm
