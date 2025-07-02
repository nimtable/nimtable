/**
 * Pragmatic error handling utility for nimtable
 * Keeps it simple - just extract the user-friendly error message
 */

/**
 * Extract error message from various error types in a pragmatic way
 * @param error - The error object, could be Error, JSON response, string, etc.
 * @returns User-friendly error message
 */
export function extractErrorMessage(error: unknown): string {
    // Handle standard Error objects
    if (error instanceof Error) {
        return error.message
    }

    // Handle API response errors (JSON objects)
    if (typeof error === "object" && error !== null) {
        const errorObj = error as Record<string, any>

        // Check common error fields in order of priority
        return errorObj.details ||
            errorObj.message ||
            errorObj.error ||
            errorObj.statusText ||
            "An error occurred"
    }

    // Handle string errors
    if (typeof error === "string") {
        return error
    }

    // Fallback for any other type
    return "An unknown error occurred 1234"
}