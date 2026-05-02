import { query } from './index';
import * as bcrypt from 'bcryptjs';

export const seedData = async () => {
  const hashedAdminPassword = await bcrypt.hash('Admin123!', 10);

  const seedSQL = `
    -- 插入科室数据
    INSERT INTO departments (id, name, code, location, capacity, avg_exam_time, is_active) VALUES
    ('dept_001', '内科', 'INTERNAL', '1楼101室', 15, 15, true),
    ('dept_002', '外科', 'SURGERY', '1楼102室', 10, 12, true),
    ('dept_003', '眼科', 'OPHTHALMOLOGY', '2楼201室', 8, 10, true),
    ('dept_004', '耳鼻喉科', 'ENT', '2楼202室', 8, 10, true),
    ('dept_005', '口腔科', 'DENTAL', '2楼203室', 6, 15, true),
    ('dept_006', '放射科', 'RADIOLOGY', '3楼301室', 5, 20, true),
    ('dept_007', '超声科', 'ULTRASOUND', '3楼302室', 6, 15, true),
    ('dept_008', '检验科', 'LAB', '4楼401室', 20, 5, true),
    ('dept_009', '心电图', 'ECG', '4楼402室', 10, 8, true),
    ('dept_010', '总检室', 'CHIEF', '5楼501室', 5, 30, true)
    ON CONFLICT (code) DO NOTHING;

    -- 插入医生数据
    INSERT INTO doctors (id, name, department_id, title, phone, role, is_active) VALUES
    ('doc_001', '张医生', 'dept_001', '主任医师', '13800138001', 'department_doctor', true),
    ('doc_002', '李医生', 'dept_001', '副主任医师', '13800138002', 'department_doctor', true),
    ('doc_003', '王医生', 'dept_002', '主任医师', '13800138003', 'department_doctor', true),
    ('doc_004', '赵医生', 'dept_003', '副主任医师', '13800138004', 'department_doctor', true),
    ('doc_005', '刘医生', 'dept_004', '主治医师', '13800138005', 'department_doctor', true),
    ('doc_006', '陈医生', 'dept_005', '主任医师', '13800138006', 'department_doctor', true),
    ('doc_007', '周医生', 'dept_006', '副主任医师', '13800138007', 'department_doctor', true),
    ('doc_008', '吴医生', 'dept_007', '主治医师', '13800138008', 'department_doctor', true),
    ('doc_009', '郑医生', 'dept_008', '主管检验师', '13800138009', 'department_doctor', true),
    ('doc_010', '孙医生', 'dept_009', '主治医师', '13800138010', 'department_doctor', true),
    ('doc_011', '黄医生', 'dept_010', '主任医师', '13800138011', 'chief_doctor', true),
    ('doc_012', '朱医生', 'dept_010', '副主任医师', '13800138012', 'chief_doctor', true)
    ON CONFLICT (id) DO NOTHING;

    -- 插入系统用户数据
    INSERT INTO users (id, username, password, name, role, doctor_id, is_active) VALUES
    ('user_001', 'admin', '${hashedAdminPassword}', '系统管理员', 'admin', NULL, true),
    ('user_002', 'reception1', '${hashedAdminPassword}', '前台小李', 'reception', NULL, true),
    ('user_003', 'reception2', '${hashedAdminPassword}', '前台小王', 'reception', NULL, true),
    ('user_004', 'doctor1', '${hashedAdminPassword}', '张医生', 'department_doctor', 'doc_001', true),
    ('user_005', 'doctor2', '${hashedAdminPassword}', '李医生', 'department_doctor', 'doc_002', true),
    ('user_006', 'chief1', '${hashedAdminPassword}', '黄医生', 'chief_doctor', 'doc_011', true),
    ('user_007', 'customer1', '${hashedAdminPassword}', '客服小张', 'customer_service', NULL, true)
    ON CONFLICT (username) DO NOTHING;

    -- 插入基础体检套餐
    INSERT INTO medical_packages (id, name, description, price, original_price, category, estimated_duration, is_active) VALUES
    ('pkg_001', '基础体检套餐A', '适合年轻人群的基础健康检查，包含常规内科、外科、血液、尿液等基础项目。', 399.00, 599.00, 'basic', 60, true),
    ('pkg_002', '标准体检套餐B', '适合中年人群的全面健康检查，在基础套餐基础上增加生化检查和影像检查。', 799.00, 1199.00, 'standard', 90, true),
    ('pkg_003', '高端体检套餐C', '适合中老年及高端人群的深度健康检查，包含肿瘤标志物、心脑血管专项检查。', 1999.00, 2999.00, 'premium', 120, true),
    ('pkg_004', '女性专项套餐', '专为女性设计的健康检查套餐，包含妇科检查、乳腺检查、HPV筛查等项目。', 899.00, 1299.00, 'custom', 90, true),
    ('pkg_005', '心脑血管专项', '针对心脑血管疾病的专项检查套餐，适合高血压、糖尿病等高危人群。', 1299.00, 1799.00, 'custom', 100, true)
    ON CONFLICT (id) DO NOTHING;

    -- 插入套餐项目 - 基础套餐A
    INSERT INTO package_items (id, package_id, name, department_id, item_type, estimated_duration, normal_range_min, normal_range_max, normal_range_unit, sort_order) VALUES
    ('item_001', 'pkg_001', '一般检查', 'dept_001', 'examination', 5, NULL, NULL, NULL, 1),
    ('item_002', 'pkg_001', '内科检查', 'dept_001', 'examination', 10, NULL, NULL, NULL, 2),
    ('item_003', 'pkg_001', '外科检查', 'dept_002', 'examination', 10, NULL, NULL, NULL, 3),
    ('item_004', 'pkg_001', '血常规', 'dept_008', 'lab', 5, NULL, NULL, NULL, 4),
    ('item_005', 'pkg_001', '尿常规', 'dept_008', 'lab', 5, NULL, NULL, NULL, 5),
    ('item_006', 'pkg_001', '肝功能三项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 6),
    ('item_007', 'pkg_001', '肾功能两项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 7),
    ('item_008', 'pkg_001', '空腹血糖', 'dept_008', 'lab', 5, 3.9, 6.1, 'mmol/L', 8),
    ('item_009', 'pkg_001', '血脂两项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 9),
    ('item_010', 'pkg_001', '心电图', 'dept_009', 'examination', 8, NULL, NULL, NULL, 10),
    ('item_011', 'pkg_001', '胸部正位片', 'dept_006', 'imaging', 15, NULL, NULL, NULL, 11)
    ON CONFLICT (id) DO NOTHING;

    -- 插入套餐项目 - 标准套餐B (基础套餐项目 + 新增项目)
    INSERT INTO package_items (id, package_id, name, department_id, item_type, estimated_duration, normal_range_min, normal_range_max, normal_range_unit, sort_order) VALUES
    ('item_012', 'pkg_002', '一般检查', 'dept_001', 'examination', 5, NULL, NULL, NULL, 1),
    ('item_013', 'pkg_002', '内科检查', 'dept_001', 'examination', 10, NULL, NULL, NULL, 2),
    ('item_014', 'pkg_002', '外科检查', 'dept_002', 'examination', 10, NULL, NULL, NULL, 3),
    ('item_015', 'pkg_002', '眼科检查', 'dept_003', 'examination', 10, NULL, NULL, NULL, 4),
    ('item_016', 'pkg_002', '耳鼻喉科检查', 'dept_004', 'examination', 10, NULL, NULL, NULL, 5),
    ('item_017', 'pkg_002', '血常规', 'dept_008', 'lab', 5, NULL, NULL, NULL, 6),
    ('item_018', 'pkg_002', '尿常规', 'dept_008', 'lab', 5, NULL, NULL, NULL, 7),
    ('item_019', 'pkg_002', '肝功能六项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 8),
    ('item_020', 'pkg_002', '肾功能三项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 9),
    ('item_021', 'pkg_002', '空腹血糖', 'dept_008', 'lab', 5, 3.9, 6.1, 'mmol/L', 10),
    ('item_022', 'pkg_002', '血脂四项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 11),
    ('item_023', 'pkg_002', '心电图', 'dept_009', 'examination', 8, NULL, NULL, NULL, 12),
    ('item_024', 'pkg_002', '胸部正位片', 'dept_006', 'imaging', 15, NULL, NULL, NULL, 13),
    ('item_025', 'pkg_002', '腹部彩超', 'dept_007', 'imaging', 20, NULL, NULL, NULL, 14)
    ON CONFLICT (id) DO NOTHING;

    -- 插入套餐项目 - 高端套餐C
    INSERT INTO package_items (id, package_id, name, department_id, item_type, estimated_duration, normal_range_min, normal_range_max, normal_range_unit, sort_order) VALUES
    ('item_026', 'pkg_003', '一般检查', 'dept_001', 'examination', 5, NULL, NULL, NULL, 1),
    ('item_027', 'pkg_003', '内科检查', 'dept_001', 'examination', 15, NULL, NULL, NULL, 2),
    ('item_028', 'pkg_003', '外科检查', 'dept_002', 'examination', 15, NULL, NULL, NULL, 3),
    ('item_029', 'pkg_003', '眼科检查', 'dept_003', 'examination', 15, NULL, NULL, NULL, 4),
    ('item_030', 'pkg_003', '耳鼻喉科检查', 'dept_004', 'examination', 10, NULL, NULL, NULL, 5),
    ('item_031', 'pkg_003', '口腔科检查', 'dept_005', 'examination', 10, NULL, NULL, NULL, 6),
    ('item_032', 'pkg_003', '血常规(五分类)', 'dept_008', 'lab', 5, NULL, NULL, NULL, 7),
    ('item_033', 'pkg_003', '尿常规', 'dept_008', 'lab', 5, NULL, NULL, NULL, 8),
    ('item_034', 'pkg_003', '大便常规+潜血', 'dept_008', 'lab', 5, NULL, NULL, NULL, 9),
    ('item_035', 'pkg_003', '肝功能八项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 10),
    ('item_036', 'pkg_003', '肾功能三项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 11),
    ('item_037', 'pkg_003', '空腹血糖', 'dept_008', 'lab', 5, 3.9, 6.1, 'mmol/L', 12),
    ('item_038', 'pkg_003', '糖化血红蛋白', 'dept_008', 'lab', 5, 4.0, 6.0, '%', 13),
    ('item_039', 'pkg_003', '血脂六项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 14),
    ('item_040', 'pkg_003', '心肌酶三项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 15),
    ('item_041', 'pkg_003', '甲状腺功能三项', 'dept_008', 'lab', 5, NULL, NULL, NULL, 16),
    ('item_042', 'pkg_003', '肿瘤标志物三项(男/女)', 'dept_008', 'lab', 5, NULL, NULL, NULL, 17),
    ('item_043', 'pkg_003', '心电图', 'dept_009', 'examination', 10, NULL, NULL, NULL, 18),
    ('item_044', 'pkg_003', '胸部CT', 'dept_006', 'imaging', 20, NULL, NULL, NULL, 19),
    ('item_045', 'pkg_003', '腹部彩超(肝脾肾胰)', 'dept_007', 'imaging', 20, NULL, NULL, NULL, 20),
    ('item_046', 'pkg_003', '颈动脉彩超', 'dept_007', 'imaging', 15, NULL, NULL, NULL, 21),
    ('item_047', 'pkg_003', '甲状腺彩超', 'dept_007', 'imaging', 15, NULL, NULL, NULL, 22)
    ON CONFLICT (id) DO NOTHING;
  `;

  try {
    await query(seedSQL);
    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

export default seedData;
