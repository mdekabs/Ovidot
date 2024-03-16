// Import necessary modules and services
import notifications from '../services/notifications.js';
import Cycle from '../models/cycle.model.js';
import User from '../models/user.model.js';
import { month as _month, calculate } from '../utility/cycle.calculator.js';
import { cycleParser } from './cycle.parsers.js';

// Constants
const MIN_UPDATE_DIFFERENCE = 7;
const DATE_FORMAT = 'YYYY-MM-DD';
const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;

/**
 * Validate user and start date.
 *
 * @param {Object} user - The user object containing information about the user.
 * @param {Date} startdate - The start date of the cycle to be checked.
 * @returns {boolean} - True if the user and start date are valid, false otherwise.
 */
const validateUserAndStartDate = (user, startDate) => {
 if (!user || !startDate) {
    return false;
 }
 return true;
};

/**
 * Check if there is an existing cycle for the given user and start date.
 *
 * @param {Object} user - The user object containing information about the user.
 * @param {Date} startdate - The start date of the cycle to be checked.
 * @returns {boolean} - True if an existing cycle needs an update or deletion, false otherwise.
 */
export const checkExistingCycle = async (user, startDate) => {
 if (!validateUserAndStartDate(user, startDate)) {
    throw new Error('Invalid user or start date');
 }

 const hasCycles = user.cycles.length > 0;

 if (hasCycles) {
    const lastCycle = user.cycles[user.cycles.length - 1];
    const nextDate = new Date(lastCycle.nextDate);
    const startDate = new Date(startDate);
    const differenceInDays = (nextDate - startDate) / MILLISECONDS_IN_A_DAY;

    return differenceInDays > MIN_UPDATE_DIFFERENCE;
 }

 return false;
};

/**
 * Create a new cycle and notify the user.
 *
 * @param {object} newCycle - The new cycle object to be saved.
 * @param {object} user - The user object.
 * @param {string} startdate - The start date of the cycle.
 * @param {Array} cycleLengths - The array of past cycle lengths.
 * @throws {Error} If an error occurred during the process.
 */
export const createCycleAndNotifyUser = async (newCycle, user, startDate, cycleLengths) => {
 if (!validateUserAndStartDate(user, startDate)) {
    throw new Error('Invalid user or start date');
 }

 try {
    const updatedData = await calculate(newCycle.period, startDate, newCycle.ovulation, cycleLengths);
    const data = cycleParser(_month(startDate), newCycle.period, startDate, updatedData);
    newCycle = { ...data, updatedAt: new Date() };
    await newCycle.save();
    await updateUserCyclesAndNotifications(user, newCycle, startDate, 'createdCycle');
 } catch (error) {
    await deleteCycleIfExists(newCycle);
    throw error;
 }
};

/**
 * Updates a cycle and generates a notification for the user.
 *
 * @param {object} cycle - The cycle object to be updated.
 * @param {number} period - The length of the menstrual period.
 * @param {number} ovulation - The day of ovulation.
 * @param {string} cycleId - The ID of the cycle to update.
 * @param {object} user - The user object.
 * @param {Array} cycleLengths - The array of past cycle lengths.
 * @return {object} - The updated cycle object.
 * @throws {Error} If an error occurred during the process.
 */
export const performUpdateAndNotify = async (cycle, period, ovulation, cycleId, user, cycleLengths) => {
 if (!validateUserAndStartDate(user, cycle.startDate)) {
    throw new Error('Invalid user or cycle start date');
 }

 try {
    const updatedData = await calculate(period, cycle.startDate, ovulation, cycleLengths);
    const data = cycleParser(_month(cycle.startDate), period, cycle.startDate.toISOString(), updatedData);
    const updatedCycle = await Cycle.findByIdAndUpdate(cycleId, {
      ...data,
      updatedAt: new Date(),
    }, { new: true });

    await updateUserCyclesAndNotifications(user, updatedCycle, cycle.startDate, 'updatedCycle');

    return updatedCycle;
 } catch (error) {
    throw error;
 }
};

/**
 * Deletes a cycle and generates a notification for the user.
 *
 * @param {string} cycleId - The ID of the cycle to be deleted.
 * @param {object} user - The user object.
 * @return {Promise} - A promise that resolves when the cycle is deleted and the notification is generated.
 * @throws {Error} If an error occurred during the process.
 */
export const performDeleteAndNotify = async (cycleId, user) => {
 try {
    const cycle = await Cycle.findByIdAndRemove(cycleId);
    await updateUserCyclesAndNotifications(user, cycle, cycle.startDate, 'deletedCycle');
    return cycle;
 } catch (error) {
    throw error;
 }
};

/**
 * Update user's cycles and notifications list.
 *
 * @param {object} user - The user object.
 * @param {object} cycle - The cycle object.
 * @param {string} startdate - The start date of the cycle.
 * @param {string} action - The action performed on the cycle.
 */
const updateUserCyclesAndNotifications = async (user, cycle, startDate, action) => {
 const message = `${action === 'createdCycle' ? 'Cycle created for' : 'Cycle for'} ${formatDate(startDate)} was ${action === 'deletedCycle' ? 'deleted' : 'updated'}`;
 const notify = notifications.generateNotification(cycle, action, message);
 user.notificationsList.push(notify);

 // Manage notifications
 notifications.manageNotification(user.notificationsList);

 // Update the user's cycles and notifications list
 await User.findByIdAndUpdate(user.id, {
    cycles: user.cycles,
    notificationsList: user.notificationsList,
 });
};

/**
 * Delete cycle if it exists.
 *
 * @param {object} cycle - The cycle object.
 */
const deleteCycleIfExists = async (cycle) => {
 if (cycle) {
    await Cycle.findByIdAndDelete(cycle._id);
 }
};

/**
 * Format a date as a string using the specified format.
 *
 * @param {Date} date - The date to format.
 * @returns {string} - The formatted date string.
 */
const formatDate = (date) => date.toISOString().split('T')[0];
