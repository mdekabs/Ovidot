import { Schema, model } from 'mongoose';

// Setup a user model
const UserSchema = Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true,
        min: 8,
        max: 55
    },
    period: {
        type: Number,
        required: true,
        min: 2,
        max: 8
    },
    notificationsList: [
        {
            type: Object
        }
    ],
    is_admin: {
        type: Boolean,
        default: false
    },
    reset: String,
    resetExp: Date,
    cycles: [
        {
            type: Schema.ObjectId,
            ref: 'Cycle'
        }
    ],
});

const User = model('User', UserSchema);
export default User;
