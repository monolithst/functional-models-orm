const merge = require('lodash/merge')

const { Model: functionalModel } = require('functional-models')

const isDirtyFalse = () => false
const isDirtyTrue = () => true

const orm = ({ datastoreProvider, modelObj = functionalModel }) => {
  if (!datastoreProvider) {
    throw new Error(`Must include a datastoreProvider`)
  }

  const _retrievedObjToModel = model => obj => {
    const keyToProperty = merge({}, obj, {
      meta: {
        isDirty: isDirtyFalse,
      },
    })
    return model.create(keyToProperty)
  }

  const fetcher = (model, id) => {
    return retrieve(model)(id)
  }

  const retrieve = model => async id => {
    const obj = await datastoreProvider.retrieve(model, id)
    if (!obj) {
      return undefined
    }
    return _retrievedObjToModel(model)(obj)
  }

  const Model = (
    modelName,
    keyToProperty,
    {
      instanceCreatedCallback = null,
      modelFunctions = {},
      instanceFunctions = {},
    } = {}
  ) => {
    /*
    NOTE: We need access to the model AFTER its built, so we have to have this state variable.
    It has been intentionally decided that recreating the model each and every time for each database retrieve is
    too much cost to obtain "functional purity". This could always be reverted back.
    */
    // eslint-disable-next-line functional/no-let
    let model = null

    const search = model => ormQuery => {
      return datastoreProvider
        .search(model, ormQuery)
        .then(({ instances, page }) => {
          return {
            instances: instances.map(_retrievedObjToModel(model)),
            page,
          }
        })
    }

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
            const valid = await instance.functions.validate.model()
            if (Object.keys(valid).length > 0) {
              throw new Error(
                `Cannot save ${modelName}. Validation errors ${Object.entries(
                  valid
                )
                  .map(([k, v]) => `${k}:${v.join(',')}`)
                  .join(';')}}.`
              )
            }
            const savedObj = await datastoreProvider.save(instance)
            return _retrievedObjToModel(model)(savedObj)
          })
        }
        // eslint-disable-next-line functional/immutable-data
        instance.functions.save = save
        // eslint-disable-next-line functional/immutable-data
        instance.functions.delete = deleteObj
        if (instanceCreatedCallback) {
          instanceCreatedCallback(instance)
        }
      },
    }
    // eslint-disable-next-line functional/immutable-data
    model = modelObj(modelName, newKeyToProperty, {
      instanceCreatedCallback: callBacks.instanceCreatedCallback,
      modelFunctions: {
        ...modelFunctions,
        retrieve,
        search,
      },
      instanceFunctions,
    })

    return merge({}, model)
  }

  return {
    Model,
    fetcher,
  }
}

module.exports = orm
