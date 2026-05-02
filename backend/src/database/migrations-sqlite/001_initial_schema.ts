import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function up(knex: Knex): Promise<void> {
  console.log('Creating SQLite database schema...');

  await knex.schema.createTable('departments', (table) => {
    table.text('id').primary();
    table.text('name').notNullable().unique();
    table.text('code').notNullable().unique();
    table.text('description');
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('roles', (table) => {
    table.text('id').primary();
    table.text('name').notNullable().unique();
    table.text('code').notNullable().unique();
    table.text('description');
    table.text('permissions').defaultTo('{}');
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('users', (table) => {
    table.text('id').primary();
    table.text('username').notNullable().unique();
    table.text('password_hash').notNullable();
    table.text('name').notNullable();
    table.text('employee_id').unique();
    table.text('role_id');
    table.text('department_id');
    table.text('phone');
    table.text('email');
    table.text('gender');
    table.date('birth_date');
    table.text('certificate_number');
    table.text('professional_title');
    table.integer('is_active').defaultTo(1);
    table.integer('is_locked').defaultTo(0);
    table.timestamp('last_login_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('audit_logs', (table) => {
    table.text('id').primary();
    table.text('user_id');
    table.text('username').notNullable();
    table.text('action').notNullable();
    table.text('module').notNullable();
    table.text('table_name');
    table.text('record_id');
    table.text('old_value');
    table.text('new_value');
    table.text('ip_address');
    table.text('user_agent');
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['action', 'created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['module', 'created_at']);
  });

  await knex.schema.createTable('patients', (table) => {
    table.text('id').primary();
    table.text('patient_number').notNullable().unique();
    table.text('name').notNullable();
    table.text('id_card_number').unique();
    table.text('gender').notNullable();
    table.date('birth_date');
    table.text('phone');
    table.text('emergency_contact');
    table.text('emergency_phone');
    table.text('address');
    table.text('allergies');
    table.text('past_medical_history');
    table.text('family_history');
    table.text('social_history');
    table.text('blood_type').defaultTo('UNKNOWN');
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['patient_number']);
    table.index(['id_card_number']);
    table.index(['name']);
  });

  await knex.schema.createTable('visit_statuses', (table) => {
    table.text('id').primary();
    table.text('code').notNullable().unique();
    table.text('name').notNullable().unique();
    table.text('description');
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('visits', (table) => {
    table.text('id').primary();
    table.text('visit_number').notNullable().unique();
    table.text('patient_id').notNullable();
    table.text('department_id');
    table.text('doctor_id');
    table.text('current_status_id');
    table.text('visit_type').notNullable().defaultTo('OUTPATIENT');
    table.timestamp('checkin_time').notNullable();
    table.timestamp('start_time');
    table.timestamp('end_time');
    table.timestamp('discharge_time');
    table.text('room_number');
    table.text('bed_number');
    table.text('chief_complaint');
    table.text('present_illness');
    table.text('past_history');
    table.text('physical_exam');
    table.text('diagnosis');
    table.text('treatment_plan');
    table.text('signed_by');
    table.timestamp('signed_at');
    table.text('signature');
    table.integer('is_archived').defaultTo(0);
    table.timestamp('archived_at');
    table.float('quality_score');
    table.text('metadata');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['visit_number']);
    table.index(['patient_id', 'created_at']);
    table.index(['doctor_id', 'created_at']);
    table.index(['department_id', 'created_at']);
  });

  await knex.schema.createTable('visit_status_history', (table) => {
    table.text('id').primary();
    table.text('visit_id').notNullable();
    table.text('status_id').notNullable();
    table.text('operator_id');
    table.text('remark');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['visit_id', 'created_at']);
  });

  await knex.schema.createTable('drug_categories', (table) => {
    table.text('id').primary();
    table.text('code').notNullable().unique();
    table.text('name').notNullable();
    table.text('parent_id');
    table.integer('sort_order').defaultTo(0);
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('drugs', (table) => {
    table.text('id').primary();
    table.text('drug_code').notNullable().unique();
    table.text('generic_name').notNullable();
    table.text('brand_name');
    table.text('specification');
    table.text('unit');
    table.text('dosage_form');
    table.text('category_id');
    table.text('manufacturer');
    table.float('price');
    table.text('indications');
    table.text('contraindications');
    table.text('adverse_reactions');
    table.text('allergic_reactions');
    table.text('usage_dosage');
    table.text('interaction_drugs');
    table.integer('is_prescription').defaultTo(1);
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['drug_code']);
    table.index(['generic_name']);
  });

  await knex.schema.createTable('prescriptions', (table) => {
    table.text('id').primary();
    table.text('prescription_number').notNullable().unique();
    table.text('visit_id').notNullable();
    table.text('patient_id').notNullable();
    table.text('doctor_id');
    table.text('type').defaultTo('REGULAR');
    table.text('status').defaultTo('DRAFT');
    table.text('conflict_message');
    table.text('doctor_override_reason');
    table.text('signed_by');
    table.timestamp('signed_at');
    table.text('signature');
    table.timestamp('dispensed_at');
    table.text('dispensed_by');
    table.text('remark');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['prescription_number']);
    table.index(['visit_id']);
    table.index(['patient_id']);
    table.index(['doctor_id']);
    table.index(['status']);
  });

  await knex.schema.createTable('prescription_items', (table) => {
    table.text('id').primary();
    table.text('prescription_id').notNullable();
    table.text('drug_id');
    table.text('drug_name').notNullable();
    table.text('specification');
    table.float('quantity');
    table.text('unit');
    table.text('dosage');
    table.text('frequency');
    table.text('route');
    table.text('instructions');
    table.float('price');
    table.float('subtotal');
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['prescription_id']);
  });

  await knex.schema.createTable('examinations', (table) => {
    table.text('id').primary();
    table.text('exam_code').notNullable().unique();
    table.text('name').notNullable();
    table.text('type').notNullable();
    table.text('department_code');
    table.float('price');
    table.text('description');
    table.text('preparation');
    table.integer('is_active').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['exam_code']);
    table.index(['name']);
  });

  await knex.schema.createTable('lab_orders', (table) => {
    table.text('id').primary();
    table.text('order_number').notNullable().unique();
    table.text('visit_id').notNullable();
    table.text('patient_id').notNullable();
    table.text('doctor_id');
    table.text('examination_id');
    table.text('exam_name').notNullable();
    table.text('status').defaultTo('PENDING');
    table.text('clinical_indication');
    table.text('doctor_remark');
    table.text('signed_by');
    table.timestamp('signed_at');
    table.text('signature');
    table.timestamp('scheduled_at');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.text('operator_id');
    table.text('result');
    table.text('result_data');
    table.text('conclusion');
    table.text('result_doctor_id');
    table.timestamp('reviewed_at');
    table.text('urgency').defaultTo('ROUTINE');
    table.text('type').defaultTo('LAB');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['order_number']);
    table.index(['visit_id']);
    table.index(['patient_id']);
    table.index(['doctor_id']);
    table.index(['status']);
  });

  await knex.schema.createTable('lab_order_items', (table) => {
    table.text('id').primary();
    table.text('lab_order_id').notNullable();
    table.text('item_name').notNullable();
    table.text('item_code');
    table.text('result');
    table.text('unit');
    table.text('reference_range');
    table.integer('is_abnormal').defaultTo(0);
    table.text('remark');
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['lab_order_id']);
  });

  await knex.schema.createTable('nursing_orders', (table) => {
    table.text('id').primary();
    table.text('order_number').notNullable().unique();
    table.text('visit_id').notNullable();
    table.text('patient_id').notNullable();
    table.text('doctor_id');
    table.text('type').notNullable();
    table.text('content').notNullable();
    table.text('frequency').defaultTo('ONCE');
    table.text('priority').defaultTo('ROUTINE');
    table.text('status').defaultTo('PENDING');
    table.timestamp('scheduled_at');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.text('nurse_id');
    table.text('execution_notes');
    table.text('vital_signs');
    table.text('signed_by');
    table.timestamp('signed_at');
    table.text('signature');
    table.text('remark');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['order_number']);
    table.index(['visit_id']);
    table.index(['patient_id']);
    table.index(['doctor_id']);
    table.index(['nurse_id']);
    table.index(['status']);
  });

  await knex.schema.createTable('structured_templates', (table) => {
    table.text('id').primary();
    table.text('code').notNullable().unique();
    table.text('name').notNullable();
    table.text('type').notNullable();
    table.text('department_code');
    table.text('schema').notNullable();
    table.text('default_values');
    table.text('validation_rules');
    table.text('description');
    table.integer('is_system').defaultTo(0);
    table.integer('is_active').defaultTo(1);
    table.integer('sort_order').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['code']);
    table.index(['type']);
  });

  await knex.schema.createTable('medical_records', (table) => {
    table.text('id').primary();
    table.text('record_number').notNullable().unique();
    table.text('visit_id').notNullable();
    table.text('patient_id').notNullable();
    table.text('doctor_id');
    table.text('type').notNullable();
    table.text('structured_data');
    table.text('plain_text');
    table.text('template_usage');
    table.text('validation_results');
    table.integer('has_warnings').defaultTo(0);
    table.text('warning_messages');
    table.text('signed_by');
    table.timestamp('signed_at');
    table.text('signature');
    table.integer('is_locked').defaultTo(0);
    table.text('version_history');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['record_number']);
    table.index(['visit_id']);
    table.index(['patient_id']);
    table.index(['doctor_id']);
  });

  await knex.schema.createTable('signatures', (table) => {
    table.text('id').primary();
    table.text('record_id').notNullable();
    table.text('record_type').notNullable();
    table.text('user_id').notNullable();
    table.text('signature_value').notNullable();
    table.text('certificate_serial');
    table.text('hash_value');
    table.text('timestamp_token');
    table.integer('is_valid').defaultTo(1);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['record_id']);
    table.index(['user_id']);
  });

  await knex.schema.createTable('archives', (table) => {
    table.text('id').primary();
    table.text('archive_number').notNullable().unique();
    table.text('visit_id').notNullable();
    table.text('patient_id').notNullable();
    table.text('patient_name').notNullable();
    table.text('doctor_id');
    table.text('doctor_name');
    table.text('department_name');
    table.float('quality_score');
    table.text('quality_check_result');
    table.text('pdf_path');
    table.text('pdf_content');
    table.text('archived_by').notNullable();
    table.timestamp('archived_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['archive_number']);
    table.index(['visit_id']);
    table.index(['patient_id']);
  });

  await knex.schema.createTable('quality_checks', (table) => {
    table.text('id').primary();
    table.text('visit_id').notNullable();
    table.float('overall_score');
    table.float('max_score');
    table.float('percentage');
    table.integer('passed');
    table.text('check_result');
    table.text('checked_by');
    table.timestamp('checked_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['visit_id']);
  });

  await knex.schema.createTable('cdss_rules', (table) => {
    table.text('id').primary();
    table.text('code').notNullable().unique();
    table.text('name').notNullable();
    table.text('type').notNullable();
    table.text('severity').defaultTo('WARNING');
    table.text('conditions').notNullable();
    table.text('actions').notNullable();
    table.text('message_template').notNullable();
    table.text('reference_source');
    table.integer('is_enabled').defaultTo(1);
    table.integer('priority').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['code']);
    table.index(['type']);
    table.index(['is_enabled']);
  });

  console.log('✅ SQLite database schema created successfully');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cdss_rules');
  await knex.schema.dropTableIfExists('quality_checks');
  await knex.schema.dropTableIfExists('archives');
  await knex.schema.dropTableIfExists('signatures');
  await knex.schema.dropTableIfExists('medical_records');
  await knex.schema.dropTableIfExists('structured_templates');
  await knex.schema.dropTableIfExists('nursing_orders');
  await knex.schema.dropTableIfExists('lab_order_items');
  await knex.schema.dropTableIfExists('lab_orders');
  await knex.schema.dropTableIfExists('examinations');
  await knex.schema.dropTableIfExists('prescription_items');
  await knex.schema.dropTableIfExists('prescriptions');
  await knex.schema.dropTableIfExists('drugs');
  await knex.schema.dropTableIfExists('drug_categories');
  await knex.schema.dropTableIfExists('visit_status_history');
  await knex.schema.dropTableIfExists('visits');
  await knex.schema.dropTableIfExists('visit_statuses');
  await knex.schema.dropTableIfExists('patients');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('departments');
}
