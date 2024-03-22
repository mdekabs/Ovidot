
/**
 * Calculate the date of the next cycle based on the start date and the total cycle days.
 *
 * @param {Date} startDate - The start date of the cycle
 * @param {Number} totalCycleDays - The total number of days in the cycle
 * @returns {Date} - The date of the next cycle
 */
export function getNextDate(startDate, totalCycleDays) {
    const nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + totalCycleDays);
    return nextDate;
}
