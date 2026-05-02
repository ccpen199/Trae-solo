exports.up = function(knex) {
  return knex.schema.createTable('promotions', function(table) {
    table.uuid('id').primary();
    table.string('code').unique().notNullable();
    table.string('name').notNullable();
    table.enum('type', ['DISCOUNT', 'COUPON', 'FLAT_RATE', 'GIFT', 'POINTS']).notNullable();
    table.enum('discount_type', ['PERCENTAGE', 'FIXED_AMOUNT']);
    table.decimal('discount_value', 10, 2);
    table.decimal('min_order_amount', 10, 2).defaultTo(0);
    table.integer('max_uses_per_player').defaultTo(1);
    table.integer('max_uses_total').defaultTo(-1);
    table.integer('used_count').defaultTo(0);
    table.json('product_ids').defaultTo('[]');
    table.json('category_ids').defaultTo('[]');
    table.json('excluded_product_ids').defaultTo('[]');
    table.integer('min_vip_level').defaultTo(0);
    table.enum('stackable', ['ALWAYS', 'WITH_SAME_TYPE', 'WITH_OTHER_TYPES', 'NEVER']).defaultTo('NEVER');
    table.integer('priority').defaultTo(0);
    table.enum('status', ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'EXPIRED']).notNullable().defaultTo('DRAFT');
    table.datetime('start_time').notNullable();
    table.datetime('end_time').notNullable();
    table.uuid('created_by').notNullable();
    table.uuid('approved_by');
    table.datetime('approved_at');
    table.json('metadata').defaultTo('{}');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').defaultTo(1);
    
    table.index(['code', 'status']);
    table.index(['status', 'start_time', 'end_time']);
    table.index(['created_by', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('promotions');
};
