exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', function(table) {
    table.uuid('id').primary();
    table.string('action').notNullable();
    table.string('entity_type').notNullable();
    table.uuid('entity_id');
    table.json('old_value').defaultTo('{}');
    table.json('new_value').defaultTo('{}');
    table.uuid('operator_id');
    table.string('operator_role');
    table.string('operator_ip');
    table.string('user_agent');
    table.json('request_info').defaultTo('{}');
    table.string('idempotency_key');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.index(['entity_type', 'entity_id', 'created_at']);
    table.index(['operator_id', 'created_at']);
    table.index(['action', 'created_at']);
    table.index('idempotency_key');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};
