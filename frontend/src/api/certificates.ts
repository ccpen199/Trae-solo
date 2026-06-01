import api from './client';
import { QualificationCertificate, PersonnelCertificate } from '../types';

export { QualificationCertificate, PersonnelCertificate };

export const getQualificationCertificates = async (): Promise<QualificationCertificate[]> => {
  const response = await api.get('/certificates/qualification');
  return response.data;
};

export const getPersonnelCertificates = async (): Promise<PersonnelCertificate[]> => {
  const response = await api.get('/certificates/personnel');
  return response.data;
};

export const createQualificationCertificate = async (data: Partial<QualificationCertificate>): Promise<QualificationCertificate> => {
  const response = await api.post('/certificates/qualification', data);
  return response.data;
};

export const createPersonnelCertificate = async (data: Partial<PersonnelCertificate>): Promise<PersonnelCertificate> => {
  const response = await api.post('/certificates/personnel', data);
  return response.data;
};

export const getExpiringCertificates = async (days: number = 30): Promise<{
  qualificationCertificates: QualificationCertificate[];
  personnelCertificates: PersonnelCertificate[];
  total: number;
}> => {
  const response = await api.get(`/certificates/expiring?days=${days}`);
  return response.data;
};
