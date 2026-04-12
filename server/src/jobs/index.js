import cron from 'node-cron';
import { db } from '../db/client.js';

export function startCronJobs() {
  // Every minute: expire groups and reward active members' ghost scores
  cron.schedule('* * * * *', async () => {
    try {
      // Find groups that just expired
      const { rows: expired } = await db().query(
        `SELECT id FROM groups WHERE expires_at <= NOW() AND health_score > 0`
      );

      for (const g of expired) {
        // Reward members who participated: +3 ghost score
        await db().query(
          `UPDATE users s
           SET ghost_score = LEAST(100, ghost_score + 3)
           FROM group_members gm
           WHERE gm.group_id=$1 AND gm.user_id=s.id AND gm.is_kicked=FALSE`,
          [g.id]
        );
        await db().query(
          `INSERT INTO ghost_events (user_id, delta, reason)
           SELECT user_id, 3, 'group completed'
           FROM group_members WHERE group_id=$1 AND is_kicked=FALSE`,
          [g.id]
        );
        // Mark expired so cron doesn't re-process
        await db().query(`UPDATE groups SET health_score=-1 WHERE id=$1`, [g.id]);
      }
    } catch (err) {
      console.error('Cron expiry error:', err);
    }
  });

  // Every hour: soft health-score recovery (groups drift back toward 100 when quiet)
  cron.schedule('0 * * * *', async () => {
    try {
      await db().query(
        `UPDATE groups
         SET health_score = LEAST(100, health_score + 5)
         WHERE expires_at > NOW() AND health_score BETWEEN 0 AND 95`
      );
    } catch (err) {
      console.error('Cron health recovery error:', err);
    }
  });

  console.log('✅  Cron jobs started');
}
