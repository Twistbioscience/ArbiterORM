const valid = require('../utils/validate')
const objEach = require('../utils/object-each')

/**
 * Class for proxying Grunt instances so that writes on them can be validated through schema
 *
 * @class Handler
 */
class Elite {
  constructor (writables) {
    this.writables = writables
  }

  // Proxy handler functions

  set (grunt, key, value) {
    if (this.writables[key]) {
      // if the value is already there then move on
      if (grunt[key] === value) {
        return true
      }
      if (grunt.__rejectMutations && grunt.__rejectMutations.has(key)) {
        const error = new Error(`Upates to field: ${key} are restricted`)
        grunt.__errors[key] = error
        return false
      }
      this.validateKey(grunt, key, value)
    }
    grunt[key] = value
    return true
  }

  get (grunt, key) {
    return grunt[key]
  }

  deleteProperty (grunt, key) {
    if (key.toLowerCase() === 'id') {
      throw new Error('Deleting Id fields is not allowed')
    } else {
      if (this.writables[key]) {
        delete grunt.__changeset[this.writables[key].sf]
        delete grunt.__errors[key]
      }
      delete grunt[key]
      return true
    }
  }

  validateKey (grunt, key, value) {
    const validator = this.writables[key].validate
    const result = validator(value)
    const mapping = this.writables[key].sf
    if (valid.getType(result) !== 'Error') {
      grunt.__changeset[mapping] = value
      delete grunt.__errors[key]
    } else {
      delete grunt.__changeset[mapping]
      grunt.__errors[key] = result
    }
    return result
  }

  validateAllKeys (grunt) {
    objEach(this.writables, field => {
      const result = this.validateKey(grunt, field, grunt[field])
      if (valid.getType(result) !== 'Error') {
        grunt[field] = result
      }
    })
  }
}

module.exports = Elite
