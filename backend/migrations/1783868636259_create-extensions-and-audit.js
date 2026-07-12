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
  pgm.createTable('extension_requests', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    booking_id: {
      type: 'uuid',
      notNull: true,
      references: 'bookings(id)',
      onDelete: 'RESTRICT',
    },
    requested_end: {
      type: 'timestamptz',
      notNull: true,
    },
    status: {
      type: 'text',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'approved', 'rejected')",
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    decided_at: {
      type: 'timestamptz',
    },
  });

  pgm.createIndex('extension_requests', 'booking_id');

  pgm.createTable('audit_log', {
    id: {
      type: 'bigint',
      primaryKey: true,
      sequenceGenerated: { precedence: 'ALWAYS' },
    },
    actor_id: {
      type: 'uuid',
      references: 'users(id)',
    },
    action: {
      type: 'text',
      notNull: true,
    },
    entity_type: {
      type: 'text',
      notNull: true,
    },
    entity_id: {
      type: 'uuid',
      notNull: true,
    },
    details: {
      type: 'jsonb',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('audit_log', ['entity_type', 'entity_id']);
  pgm.createIndex('audit_log', 'actor_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('audit_log');
  pgm.dropTable('extension_requests');
};
