export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
  timestamp: string;
}

export interface ApiValidationError {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  code?: string;
  error?: string;
  message: string | string[];
  errors?: ApiValidationError[] | string[];
  path?: string;
  method?: string;
  requestId?: string;
  timestamp: string;
}
