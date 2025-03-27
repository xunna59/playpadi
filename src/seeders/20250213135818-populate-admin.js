'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [existingAdmin] = await queryInterface.sequelize.query(
      `SELECT * FROM admins WHERE email = 'admin@xunnatech.com'`
    );

    if (!existingAdmin.length) {
      const hashedPassword = await bcrypt.hash('zxcvbnm', 10);

      await queryInterface.bulkInsert('admins', [
        {
          id: 1,
          username: 'admin',
          email: 'admin@xunnatech.com',
          password: hashedPassword,
          role: 'super admin',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    } else {
      const hashedPassword = await bcrypt.hash('zxcvbnm', 10);

      await queryInterface.bulkUpdate(
        'admins',
        {
          username: 'admin',
          password: hashedPassword,
          role: 'super admin',
          updated_at: new Date(),
        },
        {
          email: 'admin@xunnatech.com',
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('admins', null, {});
  }
};
