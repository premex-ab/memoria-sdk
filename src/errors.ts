export interface MemoriaErrorOptions {
  status: number;
  code: string;
  cause?: unknown;
}

export class MemoriaError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, opts: MemoriaErrorOptions) {
    super(message, { cause: opts.cause });
    this.name = 'MemoriaError';
    this.status = opts.status;
    this.code = opts.code;
  }
}

export class MemoriaAuthError extends MemoriaError {
  constructor(message: string, opts?: { cause?: unknown }) {
    super(message, { status: 401, code: 'unauthenticated', cause: opts?.cause });
    this.name = 'MemoriaAuthError';
  }
}

export class MemoriaQuotaError extends MemoriaError {
  readonly retryAfter: number | undefined;
  constructor(message: string, opts: { retryAfter?: number; cause?: unknown }) {
    super(message, { status: 429, code: 'quota_exceeded', cause: opts.cause });
    this.name = 'MemoriaQuotaError';
    this.retryAfter = opts.retryAfter;
  }
}

export class MemoriaNotFoundError extends MemoriaError {
  constructor(message: string, opts?: { cause?: unknown }) {
    super(message, { status: 404, code: 'not_found', cause: opts?.cause });
    this.name = 'MemoriaNotFoundError';
  }
}
