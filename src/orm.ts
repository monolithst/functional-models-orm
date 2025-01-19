import merge from 'lodash/merge'
import {
  Model as functionalModel,
  errors,
  ModelFactory,
  ModelInstanceFetcher,
  PrimaryKeyType,
  DataDescription,
  ModelInstance,
  CreateParams,
  PropertyInstance,
  ToObjectResult,
  ModelFactoryOptions,
} from 'functional-models'
import { uniqueTogether } from './validation'
import {
  OrmModelInstance,
  OrmModel,
  DatastoreProvider,
  OrmQuery,
  OrmModelFactory,
  Orm,
  OrmModelExtensions,
  OrmModelInstanceExtensions,
  OrmModelFactoryOptionsExtensions,
  OrmSearchResult,
  MinimumOrmModelDefinition,
} from './types'
import { ormQueryBuilder } from './ormQuery'

const { ValidationError } = errors

const create = ({
  datastoreProvider,
  Model = functionalModel,
}: Readonly<{
  datastoreProvider: DatastoreProvider
  Model?: ModelFactory
}>): Orm => {
  if (!datastoreProvider) {
    throw new Error(`Must include a datastoreProvider`)
  }

  const _retrievedObjToModel =
    <TData extends DataDescription>(model: OrmModel<TData>) =>
    (obj: ToObjectResult<TData>) => {
      return model.create(obj as unknown as CreateParams<TData, ''>)
    }

  // @ts-ignore
  const fetcher: ModelInstanceFetcher<
    OrmModelExtensions,
    OrmModelInstanceExtensions
  > = async <TData extends DataDescription>(
    model: OrmModel<TData>,
    id: PrimaryKeyType
  ) => {
    const x: Promise<OrmModelInstance<TData> | undefined> = retrieve<TData>(
      model,
      id
    )
    return x
  }

  const retrieve = async <T extends DataDescription>(
    model: OrmModel<T>,
    id: PrimaryKeyType
  ) => {
    const obj = await datastoreProvider.retrieve(model, id)
    if (!obj) {
      return undefined
    }
    return _retrievedObjToModel<T>(model)(obj)
  }

  const _defaultOptions = <
    T extends DataDescription,
  >(): ModelFactoryOptions<T> => ({
    instanceCreatedCallback: undefined,
  })

  const _convertOptions = <T extends DataDescription>(
    options?: ModelFactoryOptions<T, OrmModelFactoryOptionsExtensions>
  ) => {
    const r: ModelFactoryOptions<T, OrmModelFactoryOptionsExtensions> = merge(
      {},
      _defaultOptions(),
      options
    )
    return r
  }

  const ThisModel: OrmModelFactory = <T extends DataDescription>(
    modelDefinition: MinimumOrmModelDefinition<T>,
    options?: ModelFactoryOptions<T, OrmModelFactoryOptionsExtensions>
  ) => {
    /*
    NOTE: We need access to the model AFTER its built, so we have to have this state variable.
    It has been intentionally decided that recreating the model each and every time for each database retrieve is
    too much cost to obtain "functional purity". This could always be reverted back.
    */
    // @ts-ignore
    // eslint-disable-next-line functional/no-let
    let model: OrmModel<T, OrmModelExtensions, OrmModelInstanceExtensions> =
      null
    const theOptions = _convertOptions(options)

    const search = <TOverride extends DataDescription>(
      ormQuery: OrmQuery
    ): Promise<OrmSearchResult<TOverride>> => {
      return datastoreProvider.search(model, ormQuery).then(result => {
        // @ts-ignore
        const conversionFunc = _retrievedObjToModel<TOverride>(model)
        return {
          // @ts-ignore
          instances: result.instances.map(conversionFunc),
          page: result.page,
        }
      })
    }

    const searchOne = <TOverride extends DataDescription>(
      ormQuery: OrmQuery
    ) => {
      ormQuery = merge(ormQuery, { take: 1 })
      return search<TOverride>(ormQuery).then(({ instances }) => {
        return instances[0]
      })
    }

    const bulkInsert = async <TOverride extends DataDescription>(
      instances: readonly OrmModelInstance<TOverride>[]
    ) => {
      if (datastoreProvider.bulkInsert) {
        // @ts-ignore
        await datastoreProvider.bulkInsert<TOverride>(model, instances)
        return undefined
      }
      await Promise.all(instances.map(x => x.save()))
      return undefined
    }

    const loadedRetrieve = <TOverride extends DataDescription>(
      id: PrimaryKeyType
    ) => {
      // @ts-ignore
      return retrieve<TOverride>(model, id)
    }

    const modelValidators = modelDefinition?.uniqueTogether
      ? (modelDefinition.modelValidators || []).concat(
          // @ts-ignore
          uniqueTogether(modelDefinition.uniqueTogether)
        )
      : modelDefinition.modelValidators

    const ormModelDefinition = merge({}, modelDefinition, {
      modelValidators,
    })

    const _updateLastModifiedIfExistsReturnNewObj = async <
      TOverride extends DataDescription,
    >(
      instance: ModelInstance<TOverride>
    ): Promise<OrmModelInstance<TOverride>> => {
      const hasLastModified = Object.entries(
        instance.getModel().getModelDefinition().properties
      ).filter(propertyEntry => {
        const property = propertyEntry[1] as PropertyInstance<any>
        return Boolean('lastModifiedUpdateMethod' in property)
      })[0]

      const doLastModified = async () => {
        const obj = await instance.toObj<TOverride>()
        const newInstance = model.create(
          // @ts-ignore
          merge(obj, {
            [hasLastModified[0]]:
              // @ts-ignore
              hasLastModified[1].lastModifiedUpdateMethod(),
          })
        )
        return instance
      }

      // @ts-ignore
      return hasLastModified ? doLastModified() : instance
    }

    const save = async <TOverride extends DataDescription>(
      instance: ModelInstance<TOverride>
    ): Promise<OrmModelInstance<TOverride>> => {
      return Promise.resolve().then(async () => {
        const newInstance =
          await _updateLastModifiedIfExistsReturnNewObj<TOverride>(instance)
        const invalid = await newInstance.validate()
        if (invalid) {
          throw new ValidationError(model.getName(), invalid)
        }
        const savedObj = await datastoreProvider.save<TOverride>(newInstance)
        // @ts-ignore
        return _retrievedObjToModel<TOverride>(model)(savedObj)
      })
    }

    const createAndSave = async <TOverride extends DataDescription>(
      data: ModelInstance<TOverride>
    ): Promise<OrmModelInstance<TOverride>> => {
      if (datastoreProvider.createAndSave) {
        const response = await datastoreProvider.createAndSave<TOverride>(data)
        // @ts-ignore
        return _retrievedObjToModel<TOverride>(model)(response)
      }
      // @ts-ignore
      const instance = model.create(await data.toObj<TOverride>())
      return instance.save()
    }

    const deleteObj = <TOverride extends DataDescription>(
      instance: ModelInstance<TOverride>
    ) => {
      return Promise.resolve().then(async () => {
        await datastoreProvider.delete<TOverride>(instance)
      })
    }

    const _getSave = (
      instance: ModelInstance<T>
    ): (<TOverrides extends DataDescription>() => Promise<
      OrmModelInstance<TOverrides>
    >) => {
      // See if save has been overrided.
      if (theOptions.save !== undefined) {
        // @ts-ignore
        return () => theOptions.save(save, instance)
      }
      // @ts-ignore
      return () => save(instance)
    }

    const _getDelete = (instance: ModelInstance<T>) => {
      if (theOptions.delete) {
        // @ts-ignore
        return () => theOptions.delete(deleteObj, instance)
      }
      return () => deleteObj(instance)
    }

    const instanceCreatedCallback = (instance: OrmModelInstance<T>) => {
      // @ts-ignore
      // eslint-disable-next-line functional/immutable-data
      instance.save = _getSave(instance)
      // @ts-ignore
      // eslint-disable-next-line functional/immutable-data
      instance.delete = _getDelete(instance)
      if (theOptions.instanceCreatedCallback) {
        const callbacks: readonly ((instance: OrmModelInstance<T>) => void)[] =
          Array.isArray(theOptions.instanceCreatedCallback)
            ? theOptions.instanceCreatedCallback
            : [theOptions.instanceCreatedCallback]
        callbacks.forEach(x => x(instance))
      }
    }

    // Absolutely do not put theOptions as the first argument. This first argument is what is modified,
    // therefore the instanceCreatedCallback keeps calling itself instead of wrapping.
    const overridedOptions: ModelFactoryOptions<
      T,
      OrmModelFactoryOptionsExtensions
    > = merge({}, theOptions, {
      instanceCreatedCallback: [instanceCreatedCallback],
    })

    const baseModel = functionalModel<T>(ormModelDefinition, overridedOptions)
    const lowerLevelCreate = baseModel.create

    const _convertModelInstance = (
      instance: ModelInstance<T>
    ): OrmModelInstance<T> => {
      return merge(instance, {
        create,
        getModel: () => model,
        save: _getSave(instance),
        delete: _getDelete(instance),
      })
    }

    const create = <IgnoreProperties extends string = ''>(
      data: CreateParams<T, IgnoreProperties>
    ): OrmModelInstance<T> => {
      const result = lowerLevelCreate(data)
      return _convertModelInstance(result)
    }

    const _countRecursive = async (page = null): Promise<number> => {
      const results = await model.search(
        ormQueryBuilder().pagination(page).compile()
      )
      const length1 = results.instances.length
      // Don't run it again if the page is the same as a previous run.
      if (results.page && results.page !== page) {
        const length2 = await _countRecursive(results.page)
        return length1 + length2
      }
      return length1
    }

    const count = async (): Promise<number> => {
      // NOTE: This is EXTREMELY inefficient. This should be
      // overrided by a dataProvider if at all possible.
      if (datastoreProvider.count) {
        return datastoreProvider.count<T>(model)
      }
      return _countRecursive()
    }

    const getOrmModelConfigurations = () => {
      return {
        uniqueTogether: modelDefinition.uniqueTogether,
      }
    }

    model = merge(baseModel, {
      getOrmModelConfigurations,
      create,
      save,
      delete: deleteObj,
      retrieve: loadedRetrieve,
      search,
      searchOne,
      createAndSave,
      bulkInsert,
      count,
    })
    return model
  }

  return {
    Model: ThisModel,
    fetcher,
    datastoreProvider,
  }
}

export { create }
