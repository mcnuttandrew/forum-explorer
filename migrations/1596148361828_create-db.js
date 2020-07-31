/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('models', {
    id: 'id',
    item_id: {
      type: 'integer',
      notNull: true,
    },
    num_topics: {
      type: 'integer',
      notNull: true,
    },
    num_terms: {
      type: 'integer',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    model: {type: 'json', notNull: true},
    visits: {type: 'json', notNull: true},
    data: {type: 'json'},
  });
};

exports.down = (pgm) => {};
