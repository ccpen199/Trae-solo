import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const Role = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  REGISTRAR: 'REGISTRAR',
  ADMIN: 'ADMIN',
};

const DoctorTitle = {
  INTERN: 'INTERN',
  RESIDENT: 'RESIDENT',
  ATTENDING: 'ATTENDING',
  ASSOCIATE: 'ASSOCIATE',
  CHIEF: 'CHIEF',
};

const ScheduleType = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  EVENING: 'EVENING',
  FULL_DAY: 'FULL_DAY',
};

const SlotStatus = {
  AVAILABLE: 'AVAILABLE',
  LOCKED: 'LOCKED',
  BOOKED: 'BOOKED',
  CANCELLED: 'CANCELLED',
};

const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  UNKNOWN: 'UNKNOWN',
};

async function main() {
  console.log('开始种子数据...');

  const saltRounds = 10;

  const users = [
    {
      username: 'admin',
      password: await bcrypt.hash('admin123', saltRounds),
      name: '系统管理员',
      role: Role.ADMIN,
      phone: '13800000000',
      idNumber: '110101199001010001',
      gender: Gender.MALE,
    },
    {
      username: 'doctor1',
      password: await bcrypt.hash('doctor123', saltRounds),
      name: '张医生',
      role: Role.DOCTOR,
      phone: '13800000001',
      idNumber: '110101199001010002',
      gender: Gender.MALE,
    },
    {
      username: 'doctor2',
      password: await bcrypt.hash('doctor123', saltRounds),
      name: '李医生',
      role: Role.DOCTOR,
      phone: '13800000002',
      idNumber: '110101199001010003',
      gender: Gender.FEMALE,
    },
    {
      username: 'nurse1',
      password: await bcrypt.hash('nurse123', saltRounds),
      name: '王护士',
      role: Role.NURSE,
      phone: '13800000003',
      idNumber: '110101199001010004',
      gender: Gender.FEMALE,
    },
    {
      username: 'registrar1',
      password: await bcrypt.hash('registrar123', saltRounds),
      name: '刘挂号员',
      role: Role.REGISTRAR,
      phone: '13800000004',
      idNumber: '110101199001010005',
      gender: Gender.FEMALE,
    },
    {
      username: 'patient1',
      password: await bcrypt.hash('patient123', saltRounds),
      name: '陈患者',
      role: Role.PATIENT,
      phone: '13800000005',
      idNumber: '110101199001010006',
      gender: Gender.MALE,
    },
    {
      username: 'patient2',
      password: await bcrypt.hash('patient123', saltRounds),
      name: '赵患者',
      role: Role.PATIENT,
      phone: '13800000006',
      idNumber: '110101199001010007',
      gender: Gender.FEMALE,
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { username: user.username },
    });
    if (!existing) {
      await prisma.user.create({ data: user });
      console.log(`创建用户: ${user.username}`);
    }
  }

  const departments = [
    {
      name: '内科',
      code: 'NEI',
      description: '内科主要负责消化系统、循环系统等疾病的诊断和治疗',
      parentId: null as string | null,
    },
    {
      name: '外科',
      code: 'SUR',
      description: '外科主要负责手术治疗各类疾病',
      parentId: null as string | null,
    },
    {
      name: '儿科',
      code: 'PED',
      description: '儿科专门针对儿童疾病的诊断和治疗',
      parentId: null as string | null,
    },
    {
      name: '妇科',
      code: 'GYN',
      description: '妇科专门针对女性生殖系统疾病',
      parentId: null as string | null,
    },
    {
      name: '眼科',
      code: 'Oph',
      description: '眼科负责眼部疾病的诊断和治疗',
      parentId: null as string | null,
    },
    {
      name: '口腔科',
      code: 'DEN',
      description: '口腔科负责口腔疾病的诊断和治疗',
      parentId: null as string | null,
    },
    {
      name: '皮肤科',
      code: 'DER',
      description: '皮肤科负责皮肤疾病的诊断和治疗',
      parentId: null as string | null,
    },
    {
      name: '心内科',
      code: 'CAR',
      description: '心内科负责心血管疾病的诊断和治疗',
      parentId: null as string | null,
    },
  ];

  const createdDepartments: any[] = [];
  for (const dept of departments) {
    const existing = await prisma.department.findFirst({
      where: { code: dept.code },
    });
    if (!existing) {
      const created = await prisma.department.create({ data: dept });
      createdDepartments.push(created);
      console.log(`创建科室: ${dept.name}`);
    } else {
      createdDepartments.push(existing);
    }
  }

  const doctorUsers = await prisma.user.findMany({
    where: { role: Role.DOCTOR },
  });

  const doctorsData = [
    {
      userId: doctorUsers.find((u: any) => u.username === 'doctor1')?.id!,
      departmentId: createdDepartments.find((d: any) => d.code === 'NEI')?.id!,
      title: DoctorTitle.ATTENDING,
      specialties: JSON.stringify(['消化系统疾病', '胃肠疾病', '肝病']),
      introduction: '张医生，主治医师，从业10年，擅长消化系统疾病的诊断和治疗。',
      consultationFee: 50,
    },
    {
      userId: doctorUsers.find((u: any) => u.username === 'doctor2')?.id!,
      departmentId: createdDepartments.find((d: any) => d.code === 'SUR')?.id!,
      title: DoctorTitle.ASSOCIATE,
      specialties: JSON.stringify(['普外科', '微创手术', '肝胆外科']),
      introduction: '李医生，副主任医师，从业15年，擅长普外科微创手术。',
      consultationFee: 80,
    },
  ];

  for (const doc of doctorsData) {
    const existing = await prisma.doctor.findUnique({
      where: { userId: doc.userId },
    });
    if (!existing) {
      await prisma.doctor.create({ data: doc });
      console.log(`创建医生信息`);
    }
  }

  const doctors = await prisma.doctor.findMany({
    include: { user: true, department: true },
  });

  const today = new Date();

  const timeSlots = [
    { startTime: '08:00', endTime: '08:30' },
    { startTime: '08:30', endTime: '09:00' },
    { startTime: '09:00', endTime: '09:30' },
    { startTime: '09:30', endTime: '10:00' },
    { startTime: '10:00', endTime: '10:30' },
    { startTime: '10:30', endTime: '11:00' },
    { startTime: '11:00', endTime: '11:30' },
    { startTime: '11:30', endTime: '12:00' },
    { startTime: '14:00', endTime: '14:30' },
    { startTime: '14:30', endTime: '15:00' },
    { startTime: '15:00', endTime: '15:30' },
    { startTime: '15:30', endTime: '16:00' },
    { startTime: '16:00', endTime: '16:30' },
    { startTime: '16:30', endTime: '17:00' },
    { startTime: '17:00', endTime: '17:30' },
    { startTime: '17:30', endTime: '18:00' },
  ];

  for (const doctor of doctors) {
    const scheduleDate = new Date(today);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7);

    while (scheduleDate <= endDate) {
      const dayOfWeek = scheduleDate.getDay();

      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const existingSchedule = await prisma.schedule.findFirst({
          where: {
            doctorId: doctor.id,
            date: new Date(scheduleDate),
            type: ScheduleType.MORNING,
          },
        });

        if (!existingSchedule) {
          const schedule = await prisma.schedule.create({
            data: {
              doctorId: doctor.id,
              departmentId: doctor.departmentId,
              date: new Date(scheduleDate),
              type: ScheduleType.MORNING,
              startTime: '08:00',
              endTime: '12:00',
              totalSlots: 20,
              availableSlots: 20,
              isActive: true,
            },
          });

          for (let i = 0; i < 8; i++) {
            const slot = timeSlots[i];
            await prisma.timeSlot.create({
              data: {
                doctorId: doctor.id,
                scheduleId: schedule.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                status: SlotStatus.AVAILABLE,
              },
            });
          }

          const afternoonSchedule = await prisma.schedule.create({
            data: {
              doctorId: doctor.id,
              departmentId: doctor.departmentId,
              date: new Date(scheduleDate),
              type: ScheduleType.AFTERNOON,
              startTime: '14:00',
              endTime: '18:00',
              totalSlots: 20,
              availableSlots: 20,
              isActive: true,
            },
          });

          for (let i = 8; i < 16; i++) {
            const slot = timeSlots[i];
            await prisma.timeSlot.create({
              data: {
                doctorId: doctor.id,
                scheduleId: afternoonSchedule.id,
                startTime: slot.startTime,
                endTime: slot.endTime,
                status: SlotStatus.AVAILABLE,
              },
            });
          }

          console.log(
            `创建 ${doctor.user.name} 的排班: ${scheduleDate.toLocaleDateString()}`,
          );
        }
      }

      scheduleDate.setDate(scheduleDate.getDate() + 1);
    }
  }

  const configs = [
    { key: 'registration.fee.basic', value: '10', description: '基础挂号费' },
    { key: 'registration.fee.expert', value: '50', description: '专家挂号费' },
    { key: 'refund.cancel.before24h', value: '100', description: '就诊前24小时取消退款比例' },
    { key: 'refund.cancel.within24h', value: '50', description: '就诊前24小时内取消退款比例' },
    { key: 'queue.overtime.warning', value: '10', description: '超时未到警告时间(分钟)' },
  ];

  for (const config of configs) {
    const existing = await prisma.systemConfig.findUnique({
      where: { key: config.key },
    });
    if (!existing) {
      await prisma.systemConfig.create({ data: config });
      console.log(`创建系统配置: ${config.key}`);
    }
  }

  console.log('种子数据完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
