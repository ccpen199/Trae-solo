exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary();
    table.string('username').unique().notNullable();
    table.string('password').notNullable();
    table.string('nickname');
    table.string('email');
    table.string('phone');
    table.string('avatar');
    table.enum('role', ['PLAYER', 'PLANNER', 'OPERATOR', 'CUSTOMER_SERVICE', 'ADMIN']).notNullable().defaultTo('PLAYER');
    table.integer('vip_level').defaultTo(0);
    table.decimal('balance', 10, 2).defaultTo(0);
    table.integer('total_paid').defaultTo(0);
    table.integer('points').defaultTo(0);
    table.json('metadata').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.datetime('last_login_at');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.integer('version').defaultTo(1);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
