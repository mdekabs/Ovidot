import { Schema, model } from 'mongoose';

// Setup the calendar model
const CycleSchema = Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    month: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    period: {
        type: Number,
        required: true,
        min: 1
    },
    ovulation: {
        type: Date,
    },
    startDate: {
        type: Date,
        required: true
    },
    nextDate: {
        type: Date,
        required: true
    },
    days: {
        type: Number,
        required: true,
        min: 1
    },
    periodRange: [
        {
            type: Date,
            required: true
        }
    ],
    ovulationRange: [
        {
            type: Date,
            required: true,
        }
    ],
    unsafeDays: [
        {
            type: Date,
            required: true
        }
    ],
    cycleLengths: [
        {
            type: [Number],
            required: true
        }
    ]
});

const Cycle = model('Cycle', CycleSchema);
export default Cycle;

