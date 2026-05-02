exports.up = function(knex) {
  return knex.schema.createTable('stats_snapshots', function(table) {
    table.uuid('id').primary();
    table.date('snapshot_date').notNullable();
    table.string('snapshot_type').notNullable();
    table.enum('granularity', ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY']).notNullable().defaultTo('DAILY');
    table.integer('total_orders').defaultTo(0);
    table.integer('completed_orders').defaultTo(0);
    table.integer('cancelled_orders').defaultTo(0);
    table.decimal('total_revenue', 14, 2).defaultTo(0);
    table.decimal('total_discount', 14, 2).defaultTo(0);
    table.decimal('total_refund', 14, 2).defaultTo(0);
    table.integer('new_players').defaultTo(0);
    table.integer('paying_players').defaultTo(0);
    table.integer('items_sold').defaultTo(0);
    table.json('product_stats').defaultTo('{}');
    table.json('category_stats').defaultTo('{}');
    table.json('channel_stats').defaultTo('{}');
    table.json('vip_stats').defaultTo('{}');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    
    table.unique(['snapshot_date', 'snapshot_type', 'granularity']);
    table.index(['snapshot_type', 'granularity', 'snapshot_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('stats_snapshots');
};
