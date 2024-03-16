
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
      path: 'cycles',
      match: search,
    });

    return user || null;
 } catch (err) {
    console.error('Error populating user with cycles:', err.message);
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
    const user = await User.findById(userId).populate('cycles');

    return user || null;
 } catch (err) {
    console.error('Error populating user with cycles:', err.message);
    throw err;
 }
}
