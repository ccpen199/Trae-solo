exports.up = function(knex) {
  return knex.schema.createTable('backpack_items', function(table) {
    table.uuid('id').primary();
    table.uuid('player_id').notNullable();
    table.uuid('product_id').notNullable();
    table.string('product_code').notNullable();
    table.string('product_name').notNullable();
    table.enum('product_type', ['ITEM', 'CURRENCY', 'SUBSCRIPTION', 'BUNDLE', 'SKIN']).notNullable();
    table.integer('quantity').notNullable().defaultTo(1);
    table.integer('locked_quantity').defaultTo(0);
    table.json('item_data').defaultTo('{}');
    table.json('expire_data').defaultTo('{}');
    table.datetime('expire_at');
    table.uuid('order_item_id');
    table.uuid('source_id');
    table.enum('source_type', ['PURCHASE', 'GIFT', 'REWARD', 'COMPENSATION', 'SYSTEM']).notNullable().defaultTo('PURCHASE');
    table.boolean('is_active').defaultTo(true);
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').defaultTo(1);
    
    table.index(['player_id', 'product_code', 'is_active']);
    table.index(['player_id', 'product_type']);
    table.index(['order_item_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('backpack_items');
};
