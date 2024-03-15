import { differenceInDays, format, parseISO, addDays } from 'date-fns';

// Constants
const DATE_FORMAT = 'yyyy-MM-dd';
const UNSAFE_DAYS_BEFORE_OVULATION = 5;
const UNSAFE_DAYS_AFTER_OVULATION = 5;
const OVULATION_RANGE_DAYS = 15; // Days around ovulation considered unsafe

// Helper function to validate cycle lengths
const validateCycleLengths = (cycleLengths) => {
    if (!Array.isArray(cycleLengths) || cycleLengths.length === 0) {
        throw new Error("Invalid cycleLengths: Must be a non-empty array of numbers.");
    }
    if (!cycleLengths.every(length => typeof length === 'number' && length > 0)) {
        throw new Error("Invalid cycleLengths: All elements must be positive numbers.");
    }
};

// Helper function to validate dates
const validateDate = (dateString, errorMessage) => {
    try {
        parseISO(dateString);
    } catch (error) {
        throw new Error(errorMessage);
    }
};

// Helper function to validate period
const validatePeriod = (period) => {
    if (typeof period !== 'number' || period <= 0) {
        throw new Error("Invalid period: Must be a positive number.");
    }
};

/**
 * Calculates the menstrual cycle based on the provided parameters.
 * @swagger
 * /calculate:
 *   post:
 *     summary: Calculate menstrual cycle
 *     description: Calculates the menstrual cycle based on the provided parameters.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period:
 *                 type: integer
 *                 description: The length of the menstrual period in days.
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The start date of the menstrual cycle. Example: "2023-01-01".
 *               ovulation:
 *                 type: string
 *                 format: date
 *                 description: The date of ovulation. If not provided, it will be calculated based on the start date and cycle lengths. Example: "2023-01-15".
 *               cycleLengths:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: An array of cycle lengths in days for the past 6 months. Example: [28, 28, 29, 28, 28, 29].
 *     responses:
 *       200:
 *         description: The calculated menstrual cycle details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 days:
 *                   type: integer
 *                   description: The total number of days in the cycle.
 *                 periodRange:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: date
 *                   description: The range of dates for each day in the period.
 *                 ovulation:
 *                   type: string
 *                   format: date
 *                   description: The calculated date of ovulation.
 *                 ovulationRange:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: date
 *                   description: The range of dates around the ovulation date.
 *                 unsafeDays:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: date
 *                   description: The range of dates considered unsafe for conception.
 *                 nextDate:
 *                   type: string
 *                   format: date
 *                   description: The date of the next menstrual cycle.
 */
export async function calculate(period, startDate, ovulation = null, cycleLengths = []) {
    try {
        validatePeriod(period);
        validateCycleLengths(cycleLengths);
        validateDate(startDate, "Invalid startDate: Must be a valid date string.");
        if (ovulation) {
            validateDate(ovulation, "Invalid ovulation: Must be a valid date string.");
            const ovulationDate = parseISO(ovulation);
            const startDateDate = parseISO(startDate);
            const daysDifference = differenceInDays(ovulationDate, startDateDate);
            if (daysDifference < 0 || daysDifference > period) {
                throw new Error("Invalid ovulation date: Must be within the menstrual cycle.");
            }
        }

        const averageCycleLength = cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length;
        const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - averageCycleLength, 2), 0) / cycleLengths.length;
        const cycleVariability = Math.sqrt(variance);

        const dayOne = parseISO(startDate);
        let dayLast;

        const periodRange = [];

        if (ovulation === null) {
            ovulation = calculateOvulationRange(startDate, averageCycleLength, cycleVariability);
        } else {
            ovulation = parseISO(ovulation);
            dayLast = addDays(dayOne, period - 1); // The last day of menstraution

            if (ovulation <= dayLast) {
                throw new Error("Invalid ovulation date: Can't occur before or during menstraution");
            }
        }

        const totalCycleDays = differenceInDays(addDays(ovulation, OVULATION_RANGE_DAYS), dayOne);

        for (let i = 0; i < period; i++) {
            const currDate = addDays(dayOne, i);
            periodRange.push(format(currDate, DATE_FORMAT));
        }

        const ovulationRange = getOvulationRange(ovulation, dayLast);

        const unsafeRange = getUnsafeRange(ovulation, addDays(parseISO(periodRange[periodRange.length - 1]), 1));

        let nextDate = addDays(dayOne, totalCycleDays);
        nextDate = format(nextDate, DATE_FORMAT);

        return {
            days: totalCycleDays,
            periodRange,
            ovulation: format(ovulation, DATE_FORMAT),
            ovulationRange,
            unsafeDays: unsafeRange,
            nextDate
        };
    } catch (err) {
        throw err; // Rethrow the error to be caught by the caller
    }
};

// Helper functions
const calculateOvulationRange = (startDate, averageCycleLength, cycleVariability) => {
    const dayOne = parseISO(startDate);
    const estimatedOvulationStart = addDays(dayOne, -cycleVariability);
    const estimatedOvulationEnd = addDays(dayOne, averageCycleLength + cycleVariability);

    return [
        format(estimatedOvulationStart, DATE_FORMAT),
        format(estimatedOvulationEnd, DATE_FORMAT)
    ];
};

const getTotalCycleDays = (startDate, ovulation) => {
    const days = addDays(parseISO(ovulation), OVULATION_RANGE_DAYS);
    return differenceInDays(days, parseISO(startDate));
};

const getOvulationRange = (ovulation, dayLast = null) => {
    const ovulationRangeStart = addDays(parseISO(ovulation), -1);
    const ovulationRangeEnd = addDays(parseISO(ovulation), 1);

    const result = [
        format(ovulationRangeStart, DATE_FORMAT),
        format(parseISO(ovulation), DATE_FORMAT),
        format(ovulationRangeEnd, DATE_FORMAT),
    ];

    if (dayLast && ovulationRangeStart.getTime() === dayLast.getTime()) {
        result.shift(); // Remove the first element from the list.
    }

    return result;
};

const getUnsafeRange = (ovulation, lastPeriodDay) => {
    let unsafeRangeStart;
    let i = UNSAFE_DAYS_BEFORE_OVULATION;
    do {
        unsafeRangeStart = addDays(parseISO(ovulation), -i);
        i--;
    } while (differenceInDays(unsafeRangeStart, lastPeriodDay) <= 0 && i >= 0);

    const unsafeRangeEnd = addDays(parseISO(ovulation), UNSAFE_DAYS_AFTER_OVULATION);

    const unsafeDays = [];
    while (unsafeRangeStart <= unsafeRangeEnd) {
        unsafeDays.push(format(unsafeRangeStart, DATE_FORMAT));
        unsafeRangeStart = addDays(unsafeRangeStart, 1);
    }

    return unsafeDays;
};

export function month(startdate) {
    const dateObject = parseISO(startdate);
    const month = format(dateObject, 'MMMM');

    return month;
};
