const cron = require('node-cron');
const db = require('../models/index');


cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Archiving old messages...');

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

  
    await connection.query(`
      INSERT INTO ArchivedMessages SELECT * FROM messages WHERE created_at < NOW() - INTERVAL 1 DAY
    `);


    await connection.query(`
      DELETE FROM messages WHERE created_at < NOW() - INTERVAL 1 DAY
    `);

    await connection.commit();
    console.log('[CRON] Archive complete.');
  } catch (err) {
    await connection.rollback();
    console.error('[CRON] Archive failed:', err);
  } finally {
    connection.release();
  }
});
