import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('patients', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('patient_number').notNullable().unique();
    table.string('name').notNullable();
    table.string('id_card_number').unique();
    table.enum('gender', ['MALE', 'FEMALE', 'UNKNOWN']).notNullable();
    table.date('birth_date');
    table.string('phone');
    table.string('emergency_contact');
    table.string('emergency_phone');
    table.string('address');
    table.text('allergies').comment('过敏原信息，JSON格式存储');
    table.text('past_medical_history').comment('既往病史');
    table.text('family_history');
    table.jsonb('social_history');
    table.enum('blood_type', ['A', 'B', 'AB', 'O', 'UNKNOWN']).defaultTo('UNKNOWN');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.index(['patient_number']);
    table.index(['id_card_number']);
    table.index(['name']);
  });

  await knex.schema.createTable('visit_statuses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code').notNullable().unique();
    table.string('name').notNullable().unique();
    table.string('description');
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('visits', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('visit_number').notNullable().unique();
    table.uuid('patient_id').references('id').inTable('patients').onDelete('CASCADE').notNullable();
    table.uuid('department_id').references('id').inTable('departments').onDelete('SET NULL');
    table.uuid('doctor_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('current_status_id').references('id').inTable('visit_statuses').onDelete('SET NULL');
    table.enum('visit_type', ['OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'FOLLOWUP']).notNullable().defaultTo('OUTPATIENT');
    table.timestamp('checkin_time').notNullable();
    table.timestamp('start_time');
    table.timestamp('end_time');
    table.timestamp('discharge_time');
    table.string('room_number');
    table.string('bed_number');
    table.text('chief_complaint').comment('主诉');
    table.text('present_illness').comment('现病史');
    table.text('past_history').comment('既往史');
    table.text('physical_exam').comment('体格检查');
    table.text('diagnosis').comment('诊断');
    table.text('treatment_plan').comment('治疗方案');
    table.uuid('signed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('signed_at');
    table.text('signature');
    table.boolean('is_archived').defaultTo(false);
    table.timestamp('archived_at');
    table.decimal('quality_score', 5, 2).comment('病历质量评分');
    table.jsonb('metadata');
    table.timestamps(true, true);
    table.index(['visit_number']);
    table.index(['patient_id', 'created_at']);
    table.index(['doctor_id', 'created_at']);
    table.index(['department_id', 'created_at']);
    table.index(['current_status_id']);
    table.index(['checkin_time']);
  });

  await knex.schema.createTable('visit_status_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('visit_id').references('id').inTable('visits').onDelete('CASCADE').notNullable();
    table.uuid('status_id').references('id').inTable('visit_statuses').onDelete('CASCADE').notNullable();
    table.uuid('operator_id').references('id').inTable('users').onDelete('SET NULL');
    table.text('remark');
    table.timestamps(true, true);
    table.index(['visit_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('visit_status_history');
  await knex.schema.dropTableIfExists('visits');
  await knex.schema.dropTableIfExists('visit_statuses');
  await knex.schema.dropTableIfExists('patients');
}
