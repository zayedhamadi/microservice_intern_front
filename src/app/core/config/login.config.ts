export const LOGIN_CONFIG = {
  MAX_ATTEMPTS: 3,
  BLOCK_DURATION_SECONDS: 30,
  ATTEMPT_COOLDOWN: 30,
  MIN_PASSWORD_LENGTH: 6,

  CALLBACK_ROUTE: '/callback',
  SIGNIN_ROUTE: '/signin',
  SIGNUP_ROUTE: '/signup',
  FORGOT_PASSWORD_ROUTE: '/forgot-password',
} as const;
