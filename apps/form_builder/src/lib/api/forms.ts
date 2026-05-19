import type { ApiResponse, FormDefinitionSummary } from "@builder/types";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:3001";

export class FormFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FormFetchError";
  }
}

interface FormDefinitionsListResponse extends ApiResponse {
  data: FormDefinitionSummary[];
}

const makeFetch = async <T extends ApiResponse>(
  endpoint: string,
  errorMessages: { not_found?: string } = {},
  init: RequestInit = { method: "GET" },
): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, init);
  } catch {
    throw new FormFetchError(
      "Unable to reach the server. Please check your connection and try again.",
      0,
    );
  }

  if (!response.ok) {
    const message =
      response.status === 404
        ? (errorMessages.not_found ?? "Requested resource was not found.")
        : `Request failed (HTTP ${response.status}).`;
    throw new FormFetchError(message, response.status);
  }

  const body = (await response.json()) as T;
  if (body.status && body.status !== "success") {
    throw new FormFetchError(
      body.message ?? "The server returned an unexpected response.",
      500,
    );
  }

  return body;
};

export const fetchFormDefinitions = async (): Promise<
  FormDefinitionSummary[]
> => {
  const body = await makeFetch<FormDefinitionsListResponse>(
    "/form-definitions",
    { not_found: "Form definitions could not be found." },
  );
  return body.data;
};
