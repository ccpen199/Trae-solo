exports.up = function(knex) {
  return knex.schema.createTable('attachments', function(table) {
    table.uuid('id').primary();
    table.string('file_name').notNullable();
    table.string('file_path').notNullable();
    table.string('file_type');
    table.string('mime_type');
    table.integer('file_size');
    table.string('file_hash');
    table.string('entity_type');
    table.uuid('entity_id');
    table.uuid('uploaded_by').notNullable();
    table.boolean('is_verified').defaultTo(false);
    table.string('verification_result');
    table.json('metadata').defaultTo('{}');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    
    table.index(['entity_type', 'entity_id']);
    table.index(['uploaded_by', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('attachments');
};
