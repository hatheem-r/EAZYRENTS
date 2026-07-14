/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const CONSTRAINT_NAME = "vehicles_type_check";

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.dropConstraint("vehicles", CONSTRAINT_NAME);
  pgm.addConstraint("vehicles", CONSTRAINT_NAME, {
    check: "type IN ('car', 'van', 'suv', 'bike', 'scooter', 'tuktuk')",
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // This DROP+ADD will fail if any vehicles row still has type = 'tuktuk' —
  // the new CHECK is stricter than the old one, so Postgres refuses to add it
  // back while violating rows exist. That is correct behavior, not a bug:
  // reassign or remove tuktuk rows before rolling this back.
  pgm.dropConstraint("vehicles", CONSTRAINT_NAME);
  pgm.addConstraint("vehicles", CONSTRAINT_NAME, {
    check: "type IN ('car', 'van', 'suv', 'bike', 'scooter')",
  });
};
