require('../models/User')
require('../models/CloseContact')
const mongoose = require('mongoose');
const User = mongoose.model('User')
const CloseContact = mongoose.model('CloseContact')

async function index (caseId, callback) {
  try {
    const results = await CloseContact.find({case: caseId})
    return callback(null, results)
  } catch (e) {
    return callback(e, null)
  }
}

async function show (id, callback) {
  try {
    const result = await CloseContact.findById(id)
    return callback(null, result)
  } catch (e) {
    return callback(e, null)
  }
}

async function create (caseId, payload, callback) {
  try {
    let result = new CloseContact(Object.assign(payload, {
      case: caseId
    }))
    result = await result.save()

    return callback(null, result)
  } catch (error) {
    return callback(e, null)
  }
}

async function softDelete (id, callback) {
  try {
    const result = CloseContact.findByIdAndUpdate(id, {
      delete_status: 'deleted',
      deletedAt: date.toISOString()
    })
    return callback(null, result)
  } catch (error) {
    return callback(e, null)
  }
}

module.exports = [
  {
    name: 'services.closeContacts.index',
    method: index
  },
  {
    name: 'services.closeContacts.show',
    method: show
  },
  {
    name: 'services.closeContacts.delete',
    method: softDelete
  },
  {
    name: 'services.closeContacts.create',
    method: create
  }
];

