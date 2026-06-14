import { useCallback } from 'react';
import usePermission from './usePermission';
import {
  desensitize,
  desensitizeIdCard,
  desensitizePhone,
  desensitizeName,
  desensitizeEmail,
  desensitizeBankCard,
  desensitizeAddress,
  desensitizeIp,
  desensitizeLicensePlate,
} from '@/utils/desensitize';

export type DesensitizeType = 'idCard' | 'phone' | 'name' | 'email' | 'bankCard' | 'address' | 'ip' | 'licensePlate';

export interface UseDesensitizeReturn {
  desensitize: (value: string, type: DesensitizeType) => string;
  desensitizeIdCard: (value: string) => string;
  desensitizePhone: (value: string) => string;
  desensitizeName: (value: string) => string;
  desensitizeEmail: (value: string) => string;
  desensitizeBankCard: (value: string) => string;
  desensitizeAddress: (value: string) => string;
  desensitizeIp: (value: string) => string;
  desensitizeLicensePlate: (value: string) => string;
  hasPermission: () => boolean;
  canViewSensitive: () => boolean;
}

const useDesensitize = (): UseDesensitizeReturn => {
  const { hasRole, hasPermission } = usePermission();

  const hasViewSensitivePermission = useCallback(() => {
    return hasRole(['super_admin', 'admin']) || hasPermission('sensitive:view');
  }, [hasRole, hasPermission]);

  const desensitizeValue = useCallback((value: string, type: DesensitizeType): string => {
    return desensitize(value, type);
  }, []);

  const desensitizeIdCardWrap = useCallback((value: string): string => {
    return desensitizeIdCard(value);
  }, []);

  const desensitizePhoneWrap = useCallback((value: string): string => {
    return desensitizePhone(value);
  }, []);

  const desensitizeNameWrap = useCallback((value: string): string => {
    return desensitizeName(value);
  }, []);

  const desensitizeEmailWrap = useCallback((value: string): string => {
    return desensitizeEmail(value);
  }, []);

  const desensitizeBankCardWrap = useCallback((value: string): string => {
    return desensitizeBankCard(value);
  }, []);

  const desensitizeAddressWrap = useCallback((value: string): string => {
    return desensitizeAddress(value);
  }, []);

  const desensitizeIpWrap = useCallback((value: string): string => {
    return desensitizeIp(value);
  }, []);

  const desensitizeLicensePlateWrap = useCallback((value: string): string => {
    return desensitizeLicensePlate(value);
  }, []);

  return {
    desensitize: desensitizeValue,
    desensitizeIdCard: desensitizeIdCardWrap,
    desensitizePhone: desensitizePhoneWrap,
    desensitizeName: desensitizeNameWrap,
    desensitizeEmail: desensitizeEmailWrap,
    desensitizeBankCard: desensitizeBankCardWrap,
    desensitizeAddress: desensitizeAddressWrap,
    desensitizeIp: desensitizeIpWrap,
    desensitizeLicensePlate: desensitizeLicensePlateWrap,
    hasPermission: hasViewSensitivePermission,
    canViewSensitive: hasViewSensitivePermission,
  };
};

export default useDesensitize;
