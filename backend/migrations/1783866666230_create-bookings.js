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
  pgm.createTable('bookings', {
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
    renter_id: {
      type: 'uuid',
      notNull: true,
      references: 'users(id)',
      onDelete: 'RESTRICT',
    },
    period: {
      type: 'tstzrange',
      notNull: true,
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'confirmed',
      check: "status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')",
    },
    total_amount: {
      type: 'numeric(10,2)',
      notNull: true,
      check: 'total_amount >= 0',
    },
    idempotency_key: {
      type: 'text',
      unique: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint('bookings', 'bookings_period_not_empty', 'CHECK (NOT isempty(period))');
  pgm.addConstraint('bookings', 'bookings_period_valid', 'CHECK (lower(period) < upper(period))');

  pgm.addConstraint('bookings', 'no_overlapping_bookings', {
    exclude: "USING gist (vehicle_id WITH =, period WITH &&) WHERE (status IN ('confirmed', 'active'))",
  });

  pgm.createIndex('bookings', 'vehicle_id');
  pgm.createIndex('bookings', 'renter_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('bookings');
};
