export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    public readonly statusCode: number,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AuthError';
  }

  static fromHttpError(err: any): AuthError {
    const status: number = err?.status ?? 0;
    const serverMsg: string =
      err?.error?.error ?? err?.error?.message ?? err?.error ?? '';

    const msg = String(serverMsg).toLowerCase();

    if (
      status === 403 ||
      msg.includes('compte_cesse') ||
      msg.includes('compte cessé')
    ) {
      return new AuthError(
        AuthErrorCode.ACCOUNT_SUSPENDED,
        status,
        'Le compte a été désactivé.',
      );
    }

    if (
      status === 401 ||
      msg.includes('bad credentials') ||
      msg.includes('invalid credentials') ||
      msg.includes('incorrect') ||
      msg.includes('mauvais mot de passe') ||
      msg.includes('mot de passe incorrect') ||
      msg.includes('identifiants invalides')
    ) {
      return new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        status,
        'Email ou mot de passe incorrect.',
      );
    }

    if (status === 0) {
      return new AuthError(
        AuthErrorCode.NETWORK_ERROR,
        0,
        'Impossible de contacter le serveur.',
      );
    }

    if (status >= 500) {
      return new AuthError(
        AuthErrorCode.SERVER_ERROR,
        status,
        'Une erreur serveur est survenue.',
      );
    }

    return new AuthError(
      AuthErrorCode.UNKNOWN,
      status,
      'Une erreur inattendue est survenue.',
    );
  }
}