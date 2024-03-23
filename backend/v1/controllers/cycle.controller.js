
import Cycle from '../models/cycle.model.js';
import { month as _month } from '../utility/cycle.calculator.js';
import User from '../models/user.model.js';
import { validationResult } from 'express-validator';
import { populateWithCycles, populateWithCyclesBy, getCycleLengthsFromDB } from '../utility/user.populate.js';
import { validateCreateDate } from '../utility/date.validate.js';
import redisManager from '../services/caching.js';
import { cycleFilter, cycleParser } from '../utility/cycle.parsers.js';
import { checkExistingCycle, createCycleAndNotifyUser } from '../utility/cycle.helpers.js';
import { handleResponse } from '../utility/handle.response.js';
import { calculateVariance } from '../utility/calculateVariance.js';
import { getTotalCycleDays } from "../utility/getTotalCycleDays.js";
import { getNextDate } from "../utility/getNextDate.js";

/**
 * Creates a cycle for the user with provided params.
 * @param {Object} req - Express Request
 * @param {Object} res - Express Response
 * @returns Payload on Success
 */
export async function createCycle(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return handleResponse(res, 400, errors.array()[0].msg);
    }

    const userId = req.user.id;
    const { period, ovulation, startdate } = req.body;

    if (!validateCreateDate(startdate)) {
        return handleResponse(res, 400, 'Specify a proper date: Date should not be less than 21 days or greater than present day');
    }

    // Fetch cycle lengths for the user from the database
    const pastCycleLengths = await getCycleLengthsFromDB(userId);

    // Calculate variance of past cycle lengths
    const variance = calculateVariance(pastCycleLengths);

    // Calculate cycle data
    const totalCycleDays = getTotalCycleDays(startdate, ovulation, variance);
    const periodRange = getPeriodRange(startdate, period);
    const ovulationRange = getOvulationRange(ovulation, period);
    const unsafeRange = getUnsafeRange(ovulation, periodRange[periodRange.length - 1]);
    const nextDate = getNextDate(startdate, totalCycleDays);

    const month = _month(startdate);
    const data = cycleParser(month, period, startdate, {
        days: totalCycleDays,
        periodRange,
        ovulation: formatDate(ovulation),
        ovulationRange,
        unsafeDays: unsafeRange,
        nextDate
    });

    const newCycle = await Cycle.create({...data});

    const user = await populateWithCycles(userId);
    if (user === null) {
        return handleResponse(res, 404, 'User not found');
    }

    // Create the cycle and notification for the user
    await createCycleAndNotifyUser(newCycle, user, startdate);

    // Handle cache
    await Promise.resolve(redisManager.cacheDel(userId, newCycle.year.toString()));

    return res.status(201).json({
        message: 'Cycle created',
        cycleId: newCycle.id
    });

  } catch (error) {
    handleResponse(res, 500, "internal server error", error);
  }
}
