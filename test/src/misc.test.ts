import { BaseModel, TextProperty, ArrayProperty, BooleanProperty } from 'functional-models'
import { OrmModel, OrmModelInstance, OrmModelMethod, OrmModelInstanceMethod } from '../../src/interfaces'

type UserType = {
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  roles: readonly string[],
  enabled: boolean,
  getUserByEmail: OrmModelMethod<UserType>,
  canLogin: OrmModelInstanceMethod<UserType>,
  enable: OrmModelInstanceMethod<UserType>,
}

describe('miscellaneous', () => {
  describe('creating models', () => {
    it('should be able to create a model with many methods', () => {
      const myModel = BaseModel<UserType>('UserType', {
        properties: {
          firstName: TextProperty(),
          lastName: TextProperty(),
          email: TextProperty(),
          password: TextProperty(),
          roles: ArrayProperty(),
          enabled: BooleanProperty()
        },
        modelMethods: {
          getUserByEmail: (model: OrmModel<UserType>) => {},
        },
        instanceMethods: {
          canLogin: (instance: OrmModelInstance<UserType>) => {},
          enable: (instance: OrmModelInstance<UserType>) => {},
        }
      }) as OrmModel<UserType>
      const instance = myModel.create({
        firstName: 'first',
        lastName: 'last',
        email: 'myemail@email.com',
        password: 'password',
        roles: ['myrole'],
        enabled: false,
      })
      instance.methods.canLogin()
      instance.methods.enable()
      instance.methods.canLogin()
      myModel.methods.getUserByEmail('myemail@email.com')
    })
  })
})
