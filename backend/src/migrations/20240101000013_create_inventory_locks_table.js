exports.up = function(knex) {
  return knex.schema.createTable('inventory_locks', function(table) {
    table.uuid('id').primary();
    table.uuid('product_id').notNullable();
    table.string('product_code').notNullable();
    table.integer('quantity').notNullable();
    table.uuid('order_id').notNullable();
    table.uuid('player_id').notNullable();
    table.enum('lock_type', ['ORDER', 'PREORDER', 'RESERVATION']).notNullable().defaultTo('ORDER');
    table.enum('status', ['ACTIVE', 'RELEASED', 'CONFIRMED', 'EXPIRED']).notNullable().defaultTo('ACTIVE');
    table.datetime('expire_at').notNullable();
    table.datetime('released_at');
    table.uuid('released_by');
    table.json('metadata').defaultTo('{}');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    
    table.index(['product_id', 'status']);
    table.index(['order_id']);
    table.index(['player_id', 'created_at']);
    table.index(['status', 'expire_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('inventory_locks');
};
