exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.uuid('id').primary();
    table.string('payment_no').unique().notNullable();
    table.uuid('order_id').notNullable();
    table.uuid('player_id').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.enum('currency', ['CNY', 'USD', 'GAME_COIN', 'POINTS']).notNullable().defaultTo('CNY');
    table.string('payment_method').notNullable();
    table.string('channel');
    table.string('channel_order_id');
    table.text('channel_data');
    table.string('callback_signature');
    table.boolean('is_verified').defaultTo(false);
    table.enum('status', ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED']).notNullable().defaultTo('PENDING');
    table.integer('retry_count').defaultTo(0);
    table.datetime('paid_at');
    table.datetime('failed_at');
    table.datetime('refunded_at');
    table.string('idempotency_key').unique();
    table.json('metadata').defaultTo('{}');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').defaultTo(1);
    
    table.index(['order_id']);
    table.index(['player_id', 'created_at']);
    table.index(['status', 'created_at']);
    table.index('idempotency_key');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('payments');
};
