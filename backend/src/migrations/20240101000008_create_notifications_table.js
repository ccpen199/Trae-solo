exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable();
    table.enum('channel', ['IN_APP', 'EMAIL', 'SMS', 'PUSH']).notNullable().defaultTo('IN_APP');
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.enum('category', ['ORDER', 'PAYMENT', 'DELIVERY', 'REFUND', 'PROMOTION', 'SYSTEM']).notNullable();
    table.string('entity_type');
    table.uuid('entity_id');
    table.json('metadata').defaultTo('{}');
    table.boolean('is_read').defaultTo(false);
    table.datetime('read_at');
    table.boolean('is_deleted').defaultTo(false);
    table.datetime('deleted_at');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.index(['user_id', 'is_read', 'created_at']);
    table.index(['category', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notifications');
};
