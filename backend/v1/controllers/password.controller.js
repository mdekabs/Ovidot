
// PASSWORD CONTROLLER
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { handleResponse } from '../utility/handle.response.js';
import { isTokenBlacklisted, updateBlacklist } from '../middleware/tokenBlacklist.js';
import { validationResult } from 'express-validator';
import { sender } from '../services/notifications.js';
import notifications from '../services/notifications.js';
import { renderForgetTemplate } from '../services/views/handle.template.js';
import { logger } from '../middleware/logger.js';
dotenv.config();

const { genSalt, hash, compare } = bcrypt;

// Constants for password reset and error messages
const TOKEN_BLACKLISTED_ERROR_MESSAGE = "Invalid or expired token";
const INVALID_PASSWORD_OR_TOKEN_ERROR_MESSAGE = "Invalid password or token";
const PASSWORD_CHANGE_SUCCESS_MESSAGE = "Password changed";
const PASSWORD_CHANGE_FAILURE_MESSAGE = "Current password is incorrect";
const PASSWORD_RESET_SUCCESS_MESSAGE = "Password reset link sent to email";
const PASSWORD_RESET_FAILURE_MESSAGE = "Failed to send email";
const USER_NOT_FOUND_ERROR_MESSAGE = "User not found";
const INVALID_EMAIL_ERROR_MESSAGE = "Email not registered";
const PASSWORD_UPDATE_NOTIFICATION_MESSAGE = "Password changed";

// Default URL host for generating reset links.
const HOST = process.env.HOST || 'localhost';

// Default port for generating reset links.
const PORT = process.env.PORT || '3000';

// Default reset token expiration time (30 minutes).
const RESET_TOKEN_EXPIRATION = 30 * 60 * 1000;

// Default number of allowed notifications (15).
const MAX_NOTIFICATIONS = 15;

// Generate a reset token using uuid.v4.
function resetToken() {
 return uuidv4();
}

// Send reset link password to users.
export async function forgotPass(req, res) {
 try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleResponse(res, 400, errors.array()[0].msg);
    }

    const { email, url } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
      return handleResponse(res, 404, INVALID_EMAIL_ERROR_MESSAGE);
    }

    const token = resetToken();
    const resetExp = new Date(Date.now() + RESET_TOKEN_EXPIRATION);
    user.reset = token;
    user.resetExp = resetExp;
    await user.save();

    const resetLink = `${url}/${token}`;

    const forgetPass = await renderForgetTemplate(req, user, resetLink);

    const receiver = {
      to: email,
      subject: 'Password Reset',
      html: forgetPass
    };

    sender.sendMail(receiver, (error, info) => {
      if (error) {
        logger.error('Failed to send email');
        return handleResponse(res, 500, PASSWORD_RESET_FAILURE_MESSAGE, error);
      }
      return handleResponse(res, 201, PASSWORD_RESET_SUCCESS_MESSAGE);
    });
 } catch (error) {
    return handleResponse(res, 500, 'Internal Server Error', error);
 }
}

// Validate reset token.
export async function VerifyResetPass(req, res) {
 try {
    const { token } = req.params;

    if (!token) return handleResponse(res, 401, TOKEN_BLACKLISTED_ERROR_MESSAGE);

    if (isTokenBlacklisted(token)) {
      return handleResponse(res, 401, TOKEN_BLACKLISTED_ERROR_MESSAGE);
    }

    const user = await User.findOne({
      reset: token,
      resetExp: { $gt: Date.now() },
    });

    if (!user) {
      return handleResponse(res, 401, TOKEN_BLACKLISTED_ERROR_MESSAGE);
    }

    return res.status(200).json({
      message: "success",
      token
    });
 } catch (error) {
    return handleResponse(res, 500, 'Internal server error', error);
 }
}

// Reset user's password.
export async function ResetPass(req, res) {
 try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleResponse(res, 400, errors.array()[0].msg);
    }

    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return handleResponse(res, 401, INVALID_PASSWORD_OR_TOKEN_ERROR_MESSAGE);
    }

    if (isTokenBlacklisted(token)) {
      return handleResponse(res, 401, TOKEN_BLACKLISTED_ERROR_MESSAGE);
    }

    const user = await User.findOne({
      reset: token,
      resetExp: { $gt: Date.now() },
    });

    if (!user) {
      return handleResponse(res, 401, TOKEN_BLACKLISTED_ERROR_MESSAGE);
    }

    const saltRounds = 12;
    const salt = await genSalt(saltRounds);
    const hashedNewPassword = await hash(password, salt);
    user.password = hashedNewPassword;
    await user.save();

    updateBlacklist(token);

    return handleResponse(res, 200, PASSWORD_CHANGE_SUCCESS_MESSAGE);
 } catch (error) {
    return handleResponse(res, 500, 'Internal Server Error', error);
 }
}

// Change logged-in user password.
export async function changePass(req, res) {
 try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return handleResponse(res, 400, errors.array()[0].msg);
    }

    const { currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
      return handleResponse(res, 400, "Please provide a new password");
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: USER_NOT_FOUND_ERROR_MESSAGE });
    }

    const isPasswordValid = await compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return handleResponse(res, 400, PASSWORD_CHANGE_FAILURE_MESSAGE);
    }

    const saltRounds = 12;
    const salt = await genSalt(saltRounds);
    const hashedNewPassword = await hash(newPassword, salt);

    user.password = hashedNewPassword;

    // create notification
    const notify = notifications.generateNotification(user, 'updatedUser', PASSWORD_UPDATE_NOTIFICATION_MESSAGE);

    // Add new notification
    user.notificationsList.push(notify);

    // manage notifications
    notifications.manageNotification(user.notificationsList);

    await user.save();

    return res.status(204).send(PASSWORD_CHANGE_SUCCESS_MESSAGE);
 } catch (error) {
    return handleResponse(res, 500, 'Internal Server Error', error);
 }
}
