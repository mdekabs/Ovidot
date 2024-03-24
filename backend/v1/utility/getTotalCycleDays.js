
export const getTotalCycleDays = (startDate, ovulation, variance) => {
    if (!ovulation) {
        throw new Error('Ovulation date is required');
    }

    const days = new Date(ovulation);
    // Add the average number of days from ovulation to the start of the next cycle,
    // considering the variance
    days.setDate(ovulation.getDate() + 15 + variance);
    // Calculate the difference between the ovulation date and the start date
    // and convert it to days
    return Math.round((days - startDate) / MILLISECONDS_IN_A_DAY);
};
