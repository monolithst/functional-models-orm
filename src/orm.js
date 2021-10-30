const merge = require('lodash/merge')
const get = require('lodash/get')
const { Model: functionalModel } = require('functional-models')
const { ValidationError } = require('functional-models').errors

const isDirtyFalse = () => false
const isDirtyTrue = () => true
const _instanceProperties = {
  meta: {
    isDirty: isDirtyTrue,
  },
}

const orm = ({ datastoreProvider, Model = functionalModel }) => {
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

  const ThisModel = (
    modelName,
    keyToProperty,
    modelOptions ={},
    ...args) => {
    /*
    NOTE: We need access to the model AFTER its built, so we have to have this state variable.
    It has been intentionally decided that recreating the model each and every time for each database retrieve is
    too much cost to obtain "functional purity". This could always be reverted back.
    */
    // eslint-disable-next-line functional/no-let
    let model = null
    const loadedRetrieve = () => id => {
      return retrieve(model)(id)
    }

    const search = () => ormQuery => {
      return datastoreProvider.search(model, ormQuery).then(result => {
        return {
          instances: result.instances.map(_retrievedObjToModel(model)),
          page: result.page,
        }
      })
    }

    const newKeyToProperty = merge({}, keyToProperty, _instanceProperties)

    const _updateLastModifiedIfExistsReturnNewObj = async (instance) => {
      const hasLastModified = Object.entries(
        instance.meta.getModel().getProperties()
      ).filter(([_, value]) => Boolean(value.lastModifiedUpdateMethod))[0]

      return hasLastModified
        ? model.create({
          ...(await instance.functions.toObj()),
          [hasLastModified[0]]:
            hasLastModified[1].lastModifiedUpdateMethod(),
        })
        : instance
    }

    const save = (instance) => async () => {
      return Promise.resolve().then(async () => {
        const newInstance = await _updateLastModifiedIfExistsReturnNewObj(instance)
        const valid = await newInstance.functions.validate()
        if (Object.keys(valid).length > 0) {
          throw new ValidationError(modelName, valid)
        }
        const savedObj = await datastoreProvider.save(newInstance)
        return _retrievedObjToModel(model)(savedObj)
      })
    }

    const deleteObj = (Model) => (instance) => async () => {
      return Promise.resolve().then(async () => {
        await datastoreProvider.delete(instance)
      })
    }

    const callBacks = {
      instanceCreatedCallback: instance => {

        // See if save has been overrided. 
        if (instance.functions.save) {
          instance.functions.save(save)
        } else {
          // eslint-disable-next-line functional/immutable-data
          instance.functions.save = save(instance)
        }

        if (instance.functions.delete) {
          instance.functions.delete(deleteObj)
        } else {
          // eslint-disable-next-line functional/immutable-data
          instance.functions.delete = deleteObj(Model)(instance)
        }

        if (modelOptions.instanceCreatedCallback) {
          modelOptions.instanceCreatedCallback(instance)
        }
      },
    }
    const mergedModelOptions = merge({}, modelOptions, {
      instanceCreatedCallback: callBacks.instanceCreatedCallback,
      modelFunctions: {
        ...get(modelOptions, 'modelFunctions', {}),
        getPrimaryKeyName: () => modelOptions.primaryKey,
        retrieve: loadedRetrieve,
        search,
        save,
        createAndSave: () => (data) => {
          const instance = model.create(data)
          return instance.functions.save()
        },
        delete: deleteObj,
      },
    })
    model = Model(modelName, newKeyToProperty, mergedModelOptions, ...args)
    return model
  }

  return {
    Model: ThisModel,
    fetcher,
    datastoreProvider,
  }
}

module.exports = orm
