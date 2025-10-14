import { supabase } from '../lib/supabase';
import { ERROR_TYPES, type ErrorType } from '../constants/events';

interface LogErrorParams {
  errorType: ErrorType;
  errorMessage: string;
  contextData?: Record<string, any>;
  stackTrace?: string;
}

export const logEventError = async ({
  errorType,
  errorMessage,
  contextData = {},
  stackTrace,
}: LogErrorParams): Promise<void> => {
  try {
    const { error } = await supabase
      .from('event_error_logs')
      .insert({
        error_type: errorType,
        error_message: errorMessage,
        context_data: contextData,
        stack_trace: stackTrace,
      });

    if (error) {
      console.error('Failed to log error to database:', error);
    }
  } catch (err) {
    console.error('Exception while logging error:', err);
  }
};

export const logUploadError = async (
  fileName: string,
  error: Error,
  eventId?: string
): Promise<void> => {
  await logEventError({
    errorType: ERROR_TYPES.UPLOAD_FAILED,
    errorMessage: `Failed to upload file: ${fileName}`,
    contextData: {
      file_name: fileName,
      event_id: eventId,
      error_name: error.name,
    },
    stackTrace: error.stack,
  });
};

export const logProcessingError = async (
  fileName: string,
  error: Error,
  eventId?: string,
  size?: string
): Promise<void> => {
  await logEventError({
    errorType: ERROR_TYPES.PROCESSING_FAILED,
    errorMessage: `Failed to process image: ${fileName}`,
    contextData: {
      file_name: fileName,
      event_id: eventId,
      size,
      error_name: error.name,
    },
    stackTrace: error.stack,
  });
};

export const logYouTubeUrlError = async (
  url: string,
  eventId?: string
): Promise<void> => {
  await logEventError({
    errorType: ERROR_TYPES.INVALID_YOUTUBE_URL,
    errorMessage: `Invalid YouTube URL: ${url}`,
    contextData: {
      youtube_url: url,
      event_id: eventId,
    },
  });
};

export const logDatabaseError = async (
  operation: string,
  error: Error,
  contextData?: Record<string, any>
): Promise<void> => {
  await logEventError({
    errorType: ERROR_TYPES.DATABASE_ERROR,
    errorMessage: `Database operation failed: ${operation}`,
    contextData: {
      operation,
      error_name: error.name,
      ...contextData,
    },
    stackTrace: error.stack,
  });
};

export const logStorageError = async (
  operation: string,
  error: Error,
  filePath?: string,
  eventId?: string
): Promise<void> => {
  await logEventError({
    errorType: ERROR_TYPES.STORAGE_ERROR,
    errorMessage: `Storage operation failed: ${operation}`,
    contextData: {
      operation,
      file_path: filePath,
      event_id: eventId,
      error_name: error.name,
    },
    stackTrace: error.stack,
  });
};

export const logValidationError = async (
  field: string,
  value: any,
  reason: string,
  eventId?: string
): Promise<void> => {
  await logEventError({
    errorType: ERROR_TYPES.VALIDATION_ERROR,
    errorMessage: `Validation failed for ${field}: ${reason}`,
    contextData: {
      field,
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      reason,
      event_id: eventId,
    },
  });
};

export const getRecentErrors = async (limit: number = 50) => {
  const { data, error } = await supabase
    .from('event_error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch error logs:', error);
    return [];
  }

  return data || [];
};

export const getErrorsByType = async (errorType: ErrorType, limit: number = 50) => {
  const { data, error } = await supabase
    .from('event_error_logs')
    .select('*')
    .eq('error_type', errorType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch error logs:', error);
    return [];
  }

  return data || [];
};

export const getErrorsForEvent = async (eventId: string) => {
  const { data, error } = await supabase
    .from('event_error_logs')
    .select('*')
    .contains('context_data', { event_id: eventId })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch error logs for event:', error);
    return [];
  }

  return data || [];
};

export const getErrorSummary = async () => {
  const { data, error } = await supabase
    .from('event_error_logs')
    .select('error_type, created_at');

  if (error) {
    console.error('Failed to fetch error summary:', error);
    return {
      total: 0,
      byType: {},
      last24Hours: 0,
    };
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const byType: Record<string, number> = {};
  let last24Hours = 0;

  data?.forEach((log) => {
    byType[log.error_type] = (byType[log.error_type] || 0) + 1;

    const logDate = new Date(log.created_at);
    if (logDate > yesterday) {
      last24Hours++;
    }
  });

  return {
    total: data?.length || 0,
    byType,
    last24Hours,
  };
};
