import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('nursing_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('order_number').notNullable().unique();
    table.uuid('visit_id').references('id').inTable('visits').onDelete('CASCADE').notNullable();
    table.uuid('patient_id').references('id').inTable('patients').onDelete('CASCADE').notNullable();
    table.uuid('doctor_id').references('id').inTable('users').onDelete('SET NULL');
    table.enum('type', ['VITAL_SIGN', 'MEDICATION', 'TREATMENT', 'INFUSION', 'BLOOD_COLLECTION', 'NURSING_CARE', 'OTHER']).notNullable();
    table.string('content').notNullable();
    table.enum('frequency', ['ONCE', 'DAILY', 'BID', 'TID', 'QID', 'Q4H', 'Q6H', 'Q8H', 'Q12H', 'PRN', 'STAT']).defaultTo('ONCE');
    table.enum('priority', ['ROUTINE', 'URGENT', 'EMERGENCY']).defaultTo('ROUTINE');
    table.enum('status', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'HOLD']).defaultTo('PENDING');
    table.timestamp('scheduled_at');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.uuid('nurse_id').references('id').inTable('users').onDelete('SET NULL');
    table.text('execution_notes');
    table.jsonb('vital_signs').comment('生命体征数据: { temperature, pulse, respiration, bloodPressure, oxygenSaturation }');
    table.uuid('signed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('signed_at');
    table.text('signature');
    table.text('remark');
    table.timestamps(true, true);
    table.index(['order_number']);
    table.index(['visit_id']);
    table.index(['patient_id']);
    table.index(['doctor_id']);
    table.index(['nurse_id']);
    table.index(['status']);
    table.index(['scheduled_at']);
  });

  await knex.schema.createTable('structured_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code').notNullable().unique();
    table.string('name').notNullable();
    table.enum('type', ['CHIEF_COMPLAINT', 'PRESENT_ILLNESS', 'PAST_HISTORY', 'PHYSICAL_EXAM', 'DIAGNOSIS', 'TREATMENT_PLAN', 'CUSTOM']).notNullable();
    table.string('department_code');
    table.jsonb('schema').notNullable().comment('模板结构JSON Schema定义');
    table.jsonb('default_values');
    table.jsonb('validation_rules').comment('验证规则：性别限制、年龄限制、逻辑校验等');
    table.text('description');
    table.boolean('is_system').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
    table.index(['code']);
    table.index(['type']);
    table.index(['department_code']);
  });

  await knex.schema.createTable('medical_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('record_number').notNullable().unique();
    table.uuid('visit_id').references('id').inTable('visits').onDelete('CASCADE').notNullable();
    table.uuid('patient_id').references('id').inTable('patients').onDelete('CASCADE').notNullable();
    table.uuid('doctor_id').references('id').inTable('users').onDelete('SET NULL');
    table.enum('type', ['PROGRESS_NOTE', 'ADMISSION_NOTE', 'DISCHARGE_SUMMARY', 'OPERATION_NOTE', 'CONSULTATION_NOTE', 'EMERGENCY_NOTE']).notNullable();
    table.jsonb('structured_data').comment('结构化录入数据');
    table.text('plain_text');
    table.jsonb('template_usage').comment('使用的模板信息');
    table.jsonb('validation_results').comment('CDSS校验结果');
    table.boolean('has_warnings').defaultTo(false);
    table.text('warning_messages');
    table.uuid('signed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('signed_at');
    table.text('signature');
    table.boolean('is_locked').defaultTo(false);
    table.jsonb('version_history').comment('版本历史记录');
    table.timestamps(true, true);
    table.index(['record_number']);
    table.index(['visit_id']);
    table.index(['patient_id']);
    table.index(['doctor_id']);
  });

  await knex.schema.createTable('record_archives', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('archive_number').notNullable().unique();
    table.uuid('visit_id').references('id').inTable('visits').onDelete('CASCADE').notNullable();
    table.uuid('patient_id').references('id').inTable('patients').onDelete('CASCADE').notNullable();
    table.decimal('quality_score', 5, 2);
    table.jsonb('quality_check_result').comment('质检结果详情');
    table.jsonb('missing_fields').comment('缺失字段列表');
    table.string('pdf_path');
    table.string('pdf_hash');
    table.enum('status', ['PENDING_CHECK', 'CHECK_FAILED', 'READY_FOR_ARCHIVE', 'ARCHIVED']).defaultTo('PENDING_CHECK');
    table.uuid('checked_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('checked_at');
    table.uuid('archived_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('archived_at');
    table.jsonb('archive_metadata');
    table.timestamps(true, true);
    table.index(['archive_number']);
    table.index(['visit_id']);
    table.index(['patient_id']);
    table.index(['status']);
  });

  await knex.schema.createTable('cdss_rules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code').notNullable().unique();
    table.string('name').notNullable();
    table.enum('type', ['DRUG_ALLERGY', 'DRUG_INTERACTION', 'GENDER_CONFLICT', 'AGE_RESTRICTION', 'DOSAGE_CHECK', 'DIAGNOSIS_CONFLICT', 'CUSTOM']).notNullable();
    table.enum('severity', ['INFO', 'WARNING', 'ERROR', 'CRITICAL']).defaultTo('WARNING');
    table.jsonb('conditions').notNullable().comment('触发条件');
    table.jsonb('actions').notNullable().comment('执行动作');
    table.text('message_template').notNullable();
    table.text('reference_source').comment('参考来源：药典、指南等');
    table.boolean('is_enabled').defaultTo(true);
    table.integer('priority').defaultTo(0);
    table.timestamps(true, true);
    table.index(['code']);
    table.index(['type']);
    table.index(['is_enabled']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cdss_rules');
  await knex.schema.dropTableIfExists('record_archives');
  await knex.schema.dropTableIfExists('medical_records');
  await knex.schema.dropTableIfExists('structured_templates');
  await knex.schema.dropTableIfExists('nursing_orders');
}
