exports.up = function(knex) {
  return knex.schema.createTable('products', function(table) {
    table.uuid('id').primary();
    table.string('code').unique().notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.enum('type', ['ITEM', 'CURRENCY', 'SUBSCRIPTION', 'BUNDLE', 'SKIN']).notNullable();
    table.enum('category', ['WEAPON', 'ARMOR', 'POTION', 'MOUNT', 'PET', 'CURRENCY', 'VIP', 'OTHER']).notNullable();
    table.decimal('original_price', 10, 2).notNullable();
    table.decimal('current_price', 10, 2).notNullable();
    table.integer('inventory_quantity').defaultTo(-1);
    table.integer('max_per_order').defaultTo(99);
    table.integer('max_per_player').defaultTo(-1);
    table.integer('min_vip_level').defaultTo(0);
    table.json('item_data').defaultTo('{}');
    table.json('tags').defaultTo('[]');
    table.string('image_url');
    table.uuid('created_by').notNullable();
    table.uuid('approved_by');
    table.datetime('approved_at');
    table.enum('status', ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).notNullable().defaultTo('DRAFT');
    table.datetime('start_time');
    table.datetime('end_time');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').defaultTo(1);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('products');
};
