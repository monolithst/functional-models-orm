import { assert } from 'chai'
import {
  ormPropertyConfig,
  OrmModelReferenceProperty,
} from '../../src/properties'
import { unique } from '../../src/validation'
import { PropertyValidatorComponent } from 'functional-models/interfaces'
import { OrmModel } from '../../src/interfaces'

describe('/src/properties.ts', () => {
  describe('#OrmModelReferenceProperty()', () => {
    it('should be easy to use without having to put in alot of types', () => {
      type MyType = { value: string }
      const model: OrmModel<MyType> = {} as unknown as OrmModel<MyType>
      assert.doesNotThrow(() => {
        OrmModelReferenceProperty<MyType>(model)
      })
    })
  })
  describe('#ormPropertyConfig()', () => {
    it('should return one validator when unique:key is set', () => {
      const input = { unique: 'key' }
      const actual = ormPropertyConfig(input).validators.length
      const expected = 1
      assert.equal(actual, expected)
    })
    it('should return one validator when uniqueTogether:["a", "b"] is set', () => {
      const input = { uniqueTogether: ['a', 'b'] }
      const actual = ormPropertyConfig(input).validators.length
      const expected = 1
      assert.equal(actual, expected)
    })
    it('should return two validators when unique:key and uniqueTogether:["a", "b"] are set', () => {
      const input = { uniqueTogether: ['a', 'b'], unique: 'key' }
      const actual = ormPropertyConfig(input).validators.length
      const expected = 2
      assert.equal(actual, expected)
    })
    it('should return two validators when unique:key and another validator is added', () => {
      const validators: readonly PropertyValidatorComponent<any, any, any>[] = [
        unique('somethingelse'),
      ]
      const input = { unique: 'key', validators }
      const actual = ormPropertyConfig<string>(input).validators.length
      const expected = 2
      assert.equal(actual, expected)
    })
    it('should return a property passed in that is unhandled by the function', () => {
      const input = { unique: 'key', somethingNotThere: 'here' }
      const actual = ormPropertyConfig(input).somethingNotThere
      const expected = 'here'
      assert.equal(actual, expected)
    })
    it('should return no validators when an empty obj is passed', () => {
      const input = {}
      const actual = ormPropertyConfig(input).validators.length
      const expected = 0
      assert.equal(actual, expected)
    })
    it('should return no validators when nothing is passed', () => {
      const actual = ormPropertyConfig().validators.length
      const expected = 0
      assert.equal(actual, expected)
    })
  })
})
