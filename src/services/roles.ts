// roles.ts — роли пользователя для интерфейса, как на сервере (AppRoles):
// администратор и директор — руководители: видео станций, настройки камер, редактирование карты станций.
import { useAuth } from './AuthContext';

/** Роли руководителя */
export const MANAGER_ROLES = ['ADMIN', 'DIRECTOR'] as const;

/** Роль в базе записана без префикса (ADMIN), но может прийти и как ROLE_ADMIN */
export const roleName = (role: string | null | undefined): string => (role ?? '').trim().toUpperCase().replace(/^ROLE_/, '');

export const isManagerRole = (role: string | null | undefined): boolean =>
  (MANAGER_ROLES as readonly string[]).includes(roleName(role));

/** Текущий пользователь — администратор или директор */
export const useIsManager = (): boolean => isManagerRole(useAuth().userInfo.role);
