import axios from "axios";

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong. Please try again.";
  }

  const data = error.response?.data;
  if (!data) {
    return "Could not connect to the server.";
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const text = Array.isArray(messages) ? messages.join(" ") : String(messages);
        return `${field}: ${text}`;
      })
      .join(" ");
  }

  return "Request failed. Please check the form and try again.";
}
