
import User from '../models/user.model.js';

/**
 * Populate the user with the data of cycles for the provided searched keyword and return the user object.
 *
 * @param {String} userId - The ID of the user to populate.
 * @param {Object} search - The variable (key) to search.
 * @returns {Promise<User|null>} - A promise that resolves to the user object with the cycles populated or null if not found.
 */
export async function populateWithCyclesBy(userId, search) {
 try {
    const user = await User.findById(userId).populate({
      path: '_cycles',
      match: search,
    }).exec();

    return user || null;
 } catch (err) {
    throw err;
 }
}

/**
 * Return a user with the populated cycle data.
 *
 * @param {String} userId - The ID of the user to populate.
 * @returns {Promise<User|null>} - A promise that resolves to the user object with the cycles populated or null if not found.
 */
export async function populateWithCycles(userId) {
 try {
    const user = await User.findById(userId).populate({
      path: '_cycles',
    }).exec();

    return user || null;
 } catch (err) {
    throw err;
 }
}

/**
 * Retrieve the cycle lengths from the database for a given user.
 *
 * @param {String} userId - The ID of the user to retrieve cycle lengths for.
 * @returns {Promise<Array|null>} - A promise that resolves to an array of cycle lengths or null if not found.
 */
export async function getCycleLengthsFromDB(userId) {
 try {
    const user = await User.findById(userId).populate({
      path: "_cycles",
    }).exec();
   if (user.cycleLengths > 0) {
     return user.cycleLengths;
   }
   else {
     return [28];
   }
 }
  catch (err) {
    throw err;
  }
}
