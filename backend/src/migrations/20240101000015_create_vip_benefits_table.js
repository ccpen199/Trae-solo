exports.up = function(knex) {
  return knex.schema.createTable('vip_benefits', function(table) {
    table.uuid('id').primary();
    table.integer('vip_level').notNullable().unique();
    table.string('name').notNullable();
    table.string('description');
    table.decimal('discount_percent', 5, 2).defaultTo(0);
    table.decimal('extra_points_rate', 5, 2).defaultTo(0);
    table.integer('daily_gift_quantity').defaultTo(0);
    table.json('daily_gift_items').defaultTo('[]');
    table.integer('priority_access_days').defaultTo(0);
    table.json('exclusive_product_ids').defaultTo('[]');
    table.boolean('can_use_coupon').defaultTo(true);
    table.boolean('can_stack_discounts').defaultTo(false);
    table.integer('max_simultaneous_orders').defaultTo(5);
    table.integer('refund_grace_hours').defaultTo(24);
    table.boolean('is_enabled').defaultTo(true);
    table.json('metadata').defaultTo('{}');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').defaultTo(1);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('vip_benefits');
};
