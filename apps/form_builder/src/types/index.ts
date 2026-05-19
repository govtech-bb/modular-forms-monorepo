export interface ApiResponse {
  status: "success" | "failed" | string;
  message: string;
  data: unknown;
  statusCode?: number;
}

export interface FormDefinitionSummary {
  formId: string;
  title: string;
}
