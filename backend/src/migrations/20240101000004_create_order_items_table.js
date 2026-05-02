exports.up = function(knex) {
  return knex.schema.createTable('order_items', function(table) {
    table.uuid('id').primary();
    table.uuid('order_id').notNullable();
    table.uuid('product_id').notNullable();
    table.string('product_code').notNullable();
    table.string('product_name').notNullable();
    table.enum('product_type', ['ITEM', 'CURRENCY', 'SUBSCRIPTION', 'BUNDLE', 'SKIN']).notNullable();
    table.integer('quantity').notNullable().defaultTo(1);
    table.decimal('original_price', 10, 2).notNullable();
    table.decimal('discount_price', 10, 2).notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('subtotal', 10, 2).notNullable();
    table.decimal('discount_amount', 10, 2).defaultTo(0);
    table.decimal('final_amount', 10, 2).notNullable();
    table.json('item_data').defaultTo('{}');
    table.json('delivery_data').defaultTo('{}');
    table.boolean('is_delivered').defaultTo(false);
    table.datetime('delivered_at');
    table.boolean('is_refunded').defaultTo(false);
    table.decimal('refund_amount', 10, 2).defaultTo(0);
    table.datetime('refunded_at');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    
    table.index(['order_id', 'product_id']);
    table.index(['product_code', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('order_items');
};
