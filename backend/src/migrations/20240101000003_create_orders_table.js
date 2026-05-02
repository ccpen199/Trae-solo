exports.up = function(knex) {
  return knex.schema.createTable('orders', function(table) {
    table.uuid('id').primary();
    table.string('order_no').unique().notNullable();
    table.uuid('player_id').notNullable();
    table.enum('order_type', ['PURCHASE', 'REFUND', 'GIFT', 'COMPENSATION']).notNullable().defaultTo('PURCHASE');
    table.decimal('original_amount', 10, 2).notNullable();
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('final_amount', 10, 2).notNullable();
    table.enum('currency', ['CNY', 'USD', 'GAME_COIN', 'POINTS']).notNullable().defaultTo('CNY');
    table.string('payment_method');
    table.string('channel_order_id');
    table.enum('status', ['PENDING', 'LOCKED', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIAL_REFUNDED']).notNullable().defaultTo('PENDING');
    table.datetime('paid_at');
    table.datetime('shipped_at');
    table.datetime('completed_at');
    table.datetime('cancelled_at');
    table.datetime('refunded_at');
    table.string('idempotency_key').unique();
    table.integer('retry_count').defaultTo(0);
    table.string('client_ip');
    table.string('user_agent');
    table.json('metadata').defaultTo('{}');
    table.uuid('parent_order_id');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').defaultTo(1);
    
    table.index(['player_id', 'created_at']);
    table.index(['status', 'created_at']);
    table.index('order_no');
    table.index('idempotency_key');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('orders');
};
