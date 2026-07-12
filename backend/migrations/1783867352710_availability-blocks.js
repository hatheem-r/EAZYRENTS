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
  pgm.createTable('availability_blocks', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    vehicle_id: {
      type: 'uuid',
      notNull: true,
      references: 'vehicles(id)',
      onDelete: 'RESTRICT',
    },
    period: {
      type: 'tstzrange',
      notNull: true,
    },
    reason: {
      type: 'text',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint('availability_blocks', 'no_overlapping_availability_blocks', {
    exclude: 'USING gist (vehicle_id WITH =, period WITH &&)',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('availability_blocks');
};
