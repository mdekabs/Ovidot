
/**
 * Calculate the variance of an array of numbers.
 *
 * @param {Array} data - An array of numbers
 * @returns {Number} - The variance of the array
 */
export function calculateVariance(data) {
    if (data.length === 0) {
        return 0;
    }

    const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
    const squaredDifferences = data.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / data.length;
    
    return variance;
}
