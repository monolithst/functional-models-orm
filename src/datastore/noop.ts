import { DatastoreProvider } from '../interfaces'

const create = (): DatastoreProvider => {
  return {
    save: () => {
      return Promise.reject('Cannot run save in noop')
    },
    delete: () => {
      return Promise.reject('Cannot run delete in noop')
    },
    retrieve: () => {
      return Promise.reject('Cannot run retrieve in noop')
    },
    search: () => {
      return Promise.reject('Cannot run search in noop')
    },
    bulkInsert: () => {
      return Promise.reject('Cannot run bulkInsert in noop')
    },
    createAndSave: () => {
      return Promise.reject('Cannot run createAndSave in noop')
    },
    count: () => {
      return Promise.reject('Cannot run count in noop')
    },
  }
}

export { create }
