/**
 * Standardized error types and handling for Crowd Symphony
 * Provides consistent error responses across the application
 */

export type ErrorCode =
	| "VALIDATION_ERROR"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "CONFLICT"
	| "RATE_LIMITED"
	| "INTERNAL_ERROR"
	| "SERVICE_UNAVAILABLE"
	| "BAD_REQUEST"
	| "SESSION_EXPIRED"
	| "INVALID_SESSION"
	| "CAMERA_DENIED"
	| "AUDIO_CONTEXT_ERROR"
	| "MEDIAPIPE_LOAD_FAILED"
	| "REALTIME_CONNECTION_FAILED";

export interface AppError extends Error {
	code: ErrorCode;
	statusCode: number;
	details?: Record<string, unknown>;
	isOperational: boolean;
}

export class CrowdSymphonyError extends Error implements AppError {
	public readonly code: ErrorCode;
	public readonly statusCode: number;
	public readonly details?: Record<string, unknown>;
	public readonly isOperational = true;

	constructor(
		code: ErrorCode,
		message: string,
		options: { details?: Record<string, unknown>; cause?: Error } = {},
	) {
		super(message);
		this.name = "CrowdSymphonyError";
		this.code = code;
		this.statusCode = getStatusCodeForCode(code);
		this.details = options.details;
		this.isOperational = true;

		// Maintains proper stack traces in V8 environments
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, CrowdSymphonyError);
		}

		if (options.cause) {
			this.cause = options.cause;
		}
	}
}

function getStatusCodeForCode(code: ErrorCode): number {
	switch (code) {
		case "VALIDATION_ERROR":
		case "BAD_REQUEST":
			return 400;
		case "UNAUTHORIZED":
			return 401;
		case "FORBIDDEN":
			return 403;
		case "NOT_FOUND":
		case "INVALID_SESSION":
		case "SESSION_EXPIRED":
			return 404;
		case "CONFLICT":
			return 409;
		case "RATE_LIMITED":
			return 429;
		case "SERVICE_UNAVAILABLE":
			return 503;
		default:
			return 500;
	}
}

// Factory functions for common errors
export const errors = {
	validation: (message: string, details?: Record<string, unknown>) =>
		new CrowdSymphonyError("VALIDATION_ERROR", message, { details }),

	unauthorized: (message = "Authentication required") =>
		new CrowdSymphonyError("UNAUTHORIZED", message),

	forbidden: (message = "Access denied") =>
		new CrowdSymphonyError("FORBIDDEN", message),

	notFound: (resource = "Resource", details?: Record<string, unknown>) =>
		new CrowdSymphonyError("NOT_FOUND", `${resource} not found`, { details }),

	conflict: (message: string, details?: Record<string, unknown>) =>
		new CrowdSymphonyError("CONFLICT", message, { details }),

	rateLimited: (message = "Too many requests", retryAfter?: number) =>
		new CrowdSymphonyError("RATE_LIMITED", message, {
			details: { retryAfter },
		}),

	internal: (message = "Internal server error", cause?: Error) =>
		new CrowdSymphonyError("INTERNAL_ERROR", message, { cause }),

	serviceUnavailable: (service: string) =>
		new CrowdSymphonyError(
			"SERVICE_UNAVAILABLE",
			`${service} is temporarily unavailable`,
		),

	badRequest: (message: string, details?: Record<string, unknown>) =>
		new CrowdSymphonyError("BAD_REQUEST", message, { details }),

	sessionExpired: (sessionId: string) =>
		new CrowdSymphonyError("SESSION_EXPIRED", "Session has expired", {
			details: { sessionId },
		}),

	invalidSession: (sessionId: string) =>
		new CrowdSymphonyError("INVALID_SESSION", "Invalid session ID", {
			details: { sessionId },
		}),

	cameraDenied: () =>
		new CrowdSymphonyError(
			"CAMERA_DENIED",
			"Camera access was denied. Please allow camera permissions to use conductor mode.",
		),

	audioContextError: (message: string, cause?: Error) =>
		new CrowdSymphonyError("AUDIO_CONTEXT_ERROR", message, { cause }),

	mediaPipeLoadFailed: (cause?: Error) =>
		new CrowdSymphonyError(
			"MEDIAPIPE_LOAD_FAILED",
			"Failed to load hand tracking. Please refresh and try again.",
			{ cause },
		),

	realtimeConnectionFailed: (cause?: Error) =>
		new CrowdSymphonyError(
			"REALTIME_CONNECTION_FAILED",
			"Lost connection to the session. Attempting to reconnect...",
			{ cause },
		),
};

// Type guard to check if error is operational (expected)
export function isOperationalError(error: unknown): error is AppError {
	return error instanceof CrowdSymphonyError && error.isOperational === true;
}

// Convert any error to AppError
export function toAppError(error: unknown): AppError {
	if (isOperationalError(error)) {
		return error;
	}

	if (error instanceof Error) {
		// Check for specific error types
		if (error.name === "AbortError") {
			return errors.badRequest("Request was aborted");
		}
		if (error.name === "TypeError" && error.message.includes("fetch")) {
			return errors.realtimeConnectionFailed(error);
		}
		if (
			error.message.includes("MediaPipe") ||
			error.message.includes("hands")
		) {
			return errors.mediaPipeLoadFailed(error);
		}
		if (
			error.message.includes("AudioContext") ||
			error.message.includes("audio")
		) {
			return errors.audioContextError(error.message, error);
		}
		if (error.message.includes("camera") || error.message.includes("Camera")) {
			return errors.cameraDenied();
		}

		return errors.internal(error.message, error);
	}

	return errors.internal("Unknown error occurred");
}

// Error response formatter for API routes
export function formatErrorResponse(error: unknown) {
	const appError = toAppError(error);

	const response: {
		error: string;
		code: ErrorCode;
		details?: Record<string, unknown>;
	} = {
		error: appError.message,
		code: appError.code,
	};

	if (appError.details) {
		response.details = appError.details;
	}

	// Don't expose internal error details in production
	if (
		appError.code === "INTERNAL_ERROR" &&
		process.env.NODE_ENV === "production"
	) {
		response.error = "An unexpected error occurred";
		delete response.details;
	}

	return {
		response,
		statusCode: appError.statusCode,
	};
}

// Async error wrapper for API route handlers
export function withErrorHandling<T extends unknown[]>(
	handler: (...args: T) => Promise<NextResponse>,
) {
	return async (...args: T): Promise<NextResponse> => {
		try {
			return await handler(...args);
		} catch (error) {
			const { response, statusCode } = formatErrorResponse(error);
			return NextResponse.json(response, { status: statusCode });
		}
	};
}

// Import NextResponse here to avoid circular dependency
import { NextResponse } from "next/server";
