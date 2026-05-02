import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('departments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.string('code').notNullable().unique();
    table.string('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable().unique();
    table.string('code').notNullable().unique();
    table.string('description');
    table.jsonb('permissions').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('username').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.string('employee_id').unique();
    table.uuid('role_id').references('id').inTable('roles').onDelete('SET NULL');
    table.uuid('department_id').references('id').inTable('departments').onDelete('SET NULL');
    table.string('phone');
    table.string('email');
    table.enum('gender', ['MALE', 'FEMALE', 'OTHER']);
    table.date('birth_date');
    table.string('certificate_number');
    table.text('professional_title');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_locked').defaultTo(false);
    table.timestamp('last_login_at');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('username').notNullable();
    table.string('action').notNullable();
    table.string('module').notNullable();
    table.string('table_name');
    table.uuid('record_id');
    table.jsonb('old_value');
    table.jsonb('new_value');
    table.string('ip_address');
    table.string('user_agent');
    table.text('description');
    table.timestamps(true, true);
    table.index(['action', 'created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['module', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('departments');
}
