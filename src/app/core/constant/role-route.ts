export const ROLE_ROUTES: Readonly<Record<string, string>> = {
  EMPLOYEE: '/manager/dashboardmanager',
  RH: '/rh/dashboardRH',
  CANDIDAT: '/candidat/dashboardcandidat',
} as const;

export const CALENDAR_ROUTES: Readonly<Record<string, string>> = {
  EMPLOYEE: '/manager/calendrierEmployee',
  RH: '/rh/calendrierRH',
  CANDIDAT: '/candidat/calendrierCandidat',
} as const;
