const db = require('../config/db');

const DailyMission = {
  // Get all active daily missions
  getAll: async () => {
    console.log(`[${new Date().toISOString()}] INFO: DailyMission.getAll - Fetching all active daily missions.`);
    const sql = `SELECT * FROM daily_missions WHERE is_active = 1`;
    try {
      const [results] = await db.execute(sql);
      console.log(`[${new Date().toISOString()}] INFO: DailyMission.getAll - Successfully fetched ${results.length} missions.`);
      return results;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR: DailyMission.getAll - Error fetching missions:`, error);
      throw error;
    }
  },

  // Get mission by ID
  getById: async (id) => {
    console.log(`[${new Date().toISOString()}] INFO: DailyMission.getById - Fetching mission with id: ${id}.`);
    const sql = `SELECT * FROM daily_missions WHERE id = ?`;
    try {
      const [results] = await db.execute(sql, [id]);
      if (results.length === 0) {
        console.log(`[${new Date().toISOString()}] INFO: DailyMission.getById - No mission found with id: ${id}.`);
        return null; // Or throw a custom 'NotFound' error
      }
      console.log(`[${new Date().toISOString()}] INFO: DailyMission.getById - Successfully fetched mission with id: ${id}.`);
      return results[0];
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR: DailyMission.getById - Error fetching mission with id ${id}:`, error);
      throw error;
    }
  },

  // Create new mission template
  create: async (missionData) => {
    console.log(`[${new Date().toISOString()}] INFO: DailyMission.create - Creating new mission.`);
    const sql = `INSERT INTO daily_missions SET ?`;
    try {
      const [results] = await db.execute(sql, [missionData]); // Pass missionData as an object for SET ?
      console.log(`[${new Date().toISOString()}] INFO: DailyMission.create - Successfully created mission with id: ${results.insertId}.`);
      return results;
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ERROR: DailyMission.create - Error creating mission:`, error);
      throw error;
    }
  }
};

module.exports = DailyMission;
