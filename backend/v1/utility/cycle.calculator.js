import { differenceInDays, format, parseISO, addDays } from 'date-fns';

// Constants
const DATE_FORMAT = 'yyyy-MM-dd';
const UNSAFE_DAYS_BEFORE_OVULATION = 5;
const UNSAFE_DAYS_AFTER_OVULATION = 5;
const OVULATION_RANGE_DAYS = 15; // Days around ovulation considered unsafe

// Helper function to calculate the standard deviation of an array of numbers
const calculateStandardDeviation = (numbers) => {
    const mean = numbers.reduce((acc, val) => acc + val, 0) / numbers.length;
    const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
};

// Helper function to calculate the exact ovulation date based on cycle lengths using standard deviation
const calculateExactOvulationDate = (cycleLengths) => {
    const averageLength = cycleLengths.reduce((acc, val) => acc + val, 0) / cycleLengths.length;
    const standardDeviation = calculateStandardDeviation(cycleLengths);

    // Adjustment based on standard deviation
    const adjustment = standardDeviation / 2;
    return Math.round(averageLength + adjustment);
};

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

// Helper function to calculate the total cycle days
const getTotalCycleDays = (startDate, ovulation) => {
    const days = addDays(parseISO(ovulation), OVULATION_RANGE_DAYS);
    return differenceInDays(days, parseISO(startDate));
};

// Helper function to calculate the ovulation range
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

// Helper function to calculate the unsafe range
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

// Main calculate function
export function calculate(period, startDate, ovulation = null, cycleLengths = []) {
    validatePeriod(period);
    validateCycleLengths(cycleLengths);
    validateDate(startDate, "Invalid startDate: Must be a valid date string.");

    const dayOne = parseISO(startDate);
    let dayLast;

    if (ovulation === null) {
        ovulation = calculateExactOvulationDate(cycleLengths);
    } else {
        validateDate(ovulation, "Invalid ovulation: Must be a valid date string.");
        ovulation = parseISO(ovulation);
        dayLast = addDays(dayOne, period - 1); // The last day of menstraution

        if (ovulation <= dayLast) {
            throw new Error("Invalid ovulation date: Can't occur before or during menstraution");
        }
    }

    const totalCycleDays = getTotalCycleDays(startDate, format(ovulation, DATE_FORMAT));

    const periodRange = [];
    for (let i = 0; i < period; i++) {
        const currDate = addDays(dayOne, i);
        periodRange.push(format(currDate, DATE_FORMAT));
    }

    const ovulationRange = getOvulationRange(format(ovulation, DATE_FORMAT), dayLast);
    const unsafeRange = getUnsafeRange(format(ovulation, DATE_FORMAT), addDays(parseISO(periodRange[periodRange.length - 1]), 1));

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
}

// Function to get the month of a given date
export function month(startDate) {
    const dateObject = parseISO(startDate);
    const month = format(dateObject, 'MMMM');
    return month;
};
