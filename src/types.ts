export type ExtractionErrorCode =
  | "ACCESS_BLOCKED"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "EMPTY_CONTENT";

export type ApiErrorCode = ExtractionErrorCode | "INVALID_REQUEST";

export interface SchemaBlock {
  format: "json-ld" | "microdata" | "rdfa";
  type: string;
  data: Record<string, unknown>;
}

export interface ExtractionResult {
  url: string;
  schemaTypes: string[];
  blocks: SchemaBlock[];
  byType: Record<string, SchemaBlock[]>;
}

export interface ExtractionError {
  code: ExtractionErrorCode;
  message: string;
  status: number;
}

export interface ExtractionResponse {
  success: boolean;
  data?: ExtractionResult;
  error?: string;
  errorCode?: ApiErrorCode;
}
