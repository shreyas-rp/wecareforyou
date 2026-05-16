'use strict';

/**
 * Compatibility shim: makes Sequelize output look exactly like the old
 * Mongoose/Mongo responses so the Angular client needs ZERO changes.
 *
 *  - numeric `id`  ->  string `_id`
 *  - `passwordHash` stripped
 *  - eager-loaded associations renamed to the Mongo "ref" field names:
 *      user  -> userId, doctor -> doctorId, patient -> patientId
 *    (when not loaded, the scalar foreign key is returned as a string,
 *     mirroring how Mongo returned an unpopulated ObjectId string)
 *  - recurses through arrays, nested objects and JSON columns
 */
function serialize(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(serialize);

  // Sequelize instance -> plain object (also flattens nested includes).
  const obj =
    value && typeof value.get === 'function'
      ? value.get({ plain: true })
      : value;

  if (typeof obj !== 'object' || obj instanceof Date) return obj;

  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'passwordHash') continue;

    if (key === 'id') {
      out._id = val === null || val === undefined ? val : String(val);
      continue;
    }
    if (key === 'user') {
      out.userId = serialize(val);
      continue;
    }
    if (key === 'doctor') {
      out.doctorId = serialize(val);
      continue;
    }
    if (key === 'patient') {
      out.patientId = serialize(val);
      continue;
    }
    if (
      (key === 'userId' || key === 'doctorId' || key === 'patientId') &&
      (typeof val === 'number' || typeof val === 'string')
    ) {
      out[key] = val === null || val === undefined ? val : String(val);
      continue;
    }

    out[key] =
      val && typeof val === 'object' && !(val instanceof Date)
        ? serialize(val)
        : val;
  }
  return out;
}

module.exports = { serialize };
