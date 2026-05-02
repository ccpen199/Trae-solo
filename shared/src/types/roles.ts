export enum Role {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  NURSE = 'NURSE',
  REGISTRAR = 'REGISTRAR',
  ADMIN = 'ADMIN',
}

export const RoleDisplayNames: Record<Role, string> = {
  [Role.PATIENT]: '患者',
  [Role.DOCTOR]: '医生',
  [Role.NURSE]: '护士',
  [Role.REGISTRAR]: '挂号员',
  [Role.ADMIN]: '管理员',
};

export const RoleOrder: Role[] = [
  Role.PATIENT,
  Role.DOCTOR,
  Role.NURSE,
  Role.REGISTRAR,
  Role.ADMIN,
];
