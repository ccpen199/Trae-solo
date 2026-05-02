exports.up = function(knex) {
  return knex.schema.createTable('status_flows', function(table) {
    table.uuid('id').primary();
    table.string('entity_type').notNullable();
    table.uuid('entity_id').notNullable();
    table.string('old_status').notNullable();
    table.string('new_status').notNullable();
    table.text('reason');
    table.uuid('operator_id');
    table.string('operator_role');
    table.string('client_ip');
    table.json('metadata').defaultTo('{}');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.index(['entity_type', 'entity_id', 'created_at']);
    table.index(['operator_id', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('status_flows');
};
