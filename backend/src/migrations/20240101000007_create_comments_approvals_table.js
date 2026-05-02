exports.up = function(knex) {
  return knex.schema.createTable('comments_approvals', function(table) {
    table.uuid('id').primary();
    table.string('entity_type').notNullable();
    table.uuid('entity_id').notNullable();
    table.enum('type', ['COMMENT', 'APPROVAL', 'REJECTION', 'REMARK']).notNullable();
    table.text('content').notNullable();
    table.uuid('operator_id').notNullable();
    table.string('operator_role');
    table.json('metadata').defaultTo('{}');
    table.boolean('is_internal').defaultTo(false);
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.index(['entity_type', 'entity_id', 'created_at']);
    table.index(['operator_id', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('comments_approvals');
};
