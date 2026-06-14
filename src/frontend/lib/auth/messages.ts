import { isApiError } from "../api/errors";

export function authErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.statusCode === 401) {
      return "Invalid email or password.";
    }
    if (error.statusCode === 409) {
      return error.message || "This email is already registered.";
    }
    if (error.statusCode === 0 || error.code === "NETWORK_ERROR") {
      return "Unable to reach the server. Check your connection and try again.";
    }
    if (error.code === "VALIDATION_ERROR") {
      return "Please check your details and try again.";
    }
    return error.message || "Something went wrong. Please try again.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
