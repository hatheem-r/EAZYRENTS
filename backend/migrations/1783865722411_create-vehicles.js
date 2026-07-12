/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('vehicles', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    host_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'RESTRICT',
    },
    type: {
      type: 'text',
      notNull: true,
      check: "type IN ('car', 'van', 'suv', 'bike', 'scooter')",
    },
    make: {
      type: 'text',
      notNull: true,
    },
    model: {
      type: 'text',
      notNull: true,
    },
    price_per_day: {
      type: 'numeric(10,2)',
      notNull: true,
      check: 'price_per_day > 0',
    },
    city: {
      type: 'text',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    photos: {
      type: 'text[]',
      notNull: true,
      default: pgm.func("'{}'::text[]"),
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'active',
      check: "status IN ('active', 'removed')",
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('vehicles');
};
