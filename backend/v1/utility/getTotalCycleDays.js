
/**
 * Calculate the total cycle days based on the start date and ovulation date,
 * considering the variance in cycle lengths.
 *
 * @param {Date} startDate - The start date of the cycle
 * @param {Date} ovulation - The ovulation date of the cycle
 * @param {Number} variance - The variance in cycle lengths
 * @returns {Number} - The total cycle days
 */
export const getTotalCycleDays = (startDate, ovulation, variance) => {
    const days = new Date(ovulation);
    // Add the average number of days from ovulation to the start of the next cycle,
    // considering the variance
    days.setDate(ovulation.getDate() + 15 + variance);
    // Calculate the difference between the ovulation date and the start date
    // and convert it to days
    return Math.round((days - startDate) / MILLISECONDS_IN_A_DAY);
};
