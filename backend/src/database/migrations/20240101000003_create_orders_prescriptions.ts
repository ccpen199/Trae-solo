import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('drug_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('code').notNullable().unique();
    table.string('name').notNullable();
    table.uuid('parent_id').references('id').inTable('drug_categories').onDelete('SET NULL');
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('drugs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('drug_code').notNullable().unique();
    table.string('generic_name').notNullable();
    table.string('brand_name');
    table.string('specification');
    table.string('unit');
    table.string('dosage_form');
    table.uuid('category_id').references('id').inTable('drug_categories').onDelete('SET NULL');
    table.string('manufacturer');
    table.decimal('price', 10, 2);
    table.text('indications').comment('适应症');
    table.text('contraindications').comment('禁忌症');
    table.text('adverse_reactions').comment('不良反应');
    table.text('allergic_reactions').comment('过敏反应');
    table.text('usage_dosage').comment('用法用量');
    table.jsonb('interaction_drugs').comment('药物相互作用');
    table.boolean('is_prescription').defaultTo(true);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.index(['drug_code']);
    table.index(['generic_name']);
  });

  await knex.schema.createTable('prescriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('prescription_number').notNullable().unique();
    table.uuid('visit_id').references('id').inTable('visits').onDelete('CASCADE').notNullable();
    table.uuid('patient_id').references('id').inTable('patients').onDelete('CASCADE').notNullable();
    table.uuid('doctor_id').references('id').inTable('users').onDelete('SET NULL');
    table.enum('type', ['REGULAR', 'EMERGENCY', 'NARCOTIC', 'PSYCHIATRIC']).defaultTo('REGULAR');
    table.enum('status', ['DRAFT', 'PENDING_REVIEW', 'CONFLICT', 'APPROVED', 'DISPENSED', 'CANCELLED']).defaultTo('DRAFT');
    table.text('conflict_message');
    table.text('doctor_override_reason').comment('医生忽略冲突的原因');
    table.uuid('signed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('signed_at');
    table.text('signature');
    table.timestamp('dispensed_at');
    table.uuid('dispensed_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('remark');
    table.timestamps(true, true);
    table.index(['prescription_number']);
    table.index(['visit_id']);
    table.index(['patient_id']);
    table.index(['doctor_id']);
    table.index(['status']);
  });

  await knex.schema.createTable('prescription_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('prescription_id').references('id').inTable('prescriptions').onDelete('CASCADE').notNullable();
    table.uuid('drug_id').references('id').inTable('drugs').onDelete('SET NULL');
    table.string('drug_name').notNullable();
    table.string('specification');
    table.decimal('quantity', 10, 2);
    table.string('unit');
    table.string('dosage');
    table.string('frequency');
    table.string('route');
    table.text('instructions');
    table.decimal('price', 10, 2);
    table.decimal('subtotal', 10, 2);
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
    table.index(['prescription_id']);
  });

  await knex.schema.createTable('examinations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('exam_code').notNullable().unique();
    table.string('name').notNullable();
    table.enum('type', ['LAB', 'IMAGE', 'FUNCTION', 'OTHER']).notNullable();
    table.string('department_code');
    table.decimal('price', 10, 2);
    table.text('description');
    table.text('preparation');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.index(['exam_code']);
    table.index(['name']);
  });

  await knex.schema.createTable('exam_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('order_number').notNullable().unique();
    table.uuid('visit_id').references('id').inTable('visits').onDelete('CASCADE').notNullable();
    table.uuid('patient_id').references('id').inTable('patients').onDelete('CASCADE').notNullable();
    table.uuid('doctor_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('examination_id').references('id').inTable('examinations').onDelete('SET NULL');
    table.string('exam_name').notNullable();
    table.enum('status', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).defaultTo('PENDING');
    table.text('clinical_indication').comment('临床指征');
    table.text('doctor_remark');
    table.uuid('signed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('signed_at');
    table.text('signature');
    table.timestamp('scheduled_at');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.uuid('operator_id').references('id').inTable('users').onDelete('SET NULL');
    table.text('result');
    table.jsonb('result_data');
    table.text('conclusion');
    table.uuid('result_doctor_id').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('reviewed_at');
    table.timestamps(true, true);
    table.index(['order_number']);
    table.index(['visit_id']);
    table.index(['patient_id']);
    table.index(['doctor_id']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('exam_orders');
  await knex.schema.dropTableIfExists('examinations');
  await knex.schema.dropTableIfExists('prescription_items');
  await knex.schema.dropTableIfExists('prescriptions');
  await knex.schema.dropTableIfExists('drugs');
  await knex.schema.dropTableIfExists('drug_categories');
}
