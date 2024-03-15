// cycle.model.js

import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const CycleSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  period: {
    type: Number,
    required: true
  },
  ovulationDate: {
    type: Date,
    required: true
  },
  cycleLength: {
    type: Number,
    required: true
  },
  // Add other cycle details as needed
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Cycle = mongoose.model('Cycle', CycleSchema);

export default Cycle;
