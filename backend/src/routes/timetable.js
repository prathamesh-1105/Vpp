const express = require('express');
const { executeTenantQuery } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/v1/timetable/today
 * @desc    Fetch active timetable slots for the student's registered courses today
 * @access  Private (Student)
 */
router.get('/today', authenticateToken, async (req, res) => {
  const tenantId = req.tenantId; // Resolves from tenantGuard
  const userId = req.user.id;    // Resolves from JWT authenticateToken

  try {
    // 1. Fetch student information (semester, department)
    const studentResult = await executeTenantQuery(
      tenantId,
      'SELECT dept_id, current_semester FROM students WHERE user_id = $1',
      [userId]
    );

    const student = studentResult.rows[0];
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record details not found."
      });
    }

    // Map JS day integer to string matching database check constraint
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()]; 

    // 2. Query schedules matching the student's profile context (RLS auto-isolates tenants)
    const query = `
      SELECT t.id, t.start_time, t.end_time, t.section_code,
             c.name AS course_name, c.code AS course_code,
             l.building_name, l.room_number,
             CONCAT(u.first_name, ' ', u.last_name) AS instructor_name
      FROM timetables t
      JOIN courses c ON t.course_id = c.id
      JOIN physical_locations l ON t.location_id = l.id
      JOIN faculties f ON t.faculty_id = f.user_id
      JOIN users u ON f.user_id = u.id
      WHERE t.tenant_id = $1
        AND t.semester = $2
        AND t.day_of_week = $3
      ORDER BY t.start_time ASC
    `;

    const timetableResult = await executeTenantQuery(
      tenantId,
      query,
      [tenantId, student.current_semester, currentDay]
    );

    return res.status(200).json({
      success: true,
      day: currentDay,
      count: timetableResult.rows.length,
      schedule: timetableResult.rows
    });

  } catch (error) {
    console.error("Timetable Retrieval Error:", error);
    return res.status(500).json({
      success: false,
      message: "Database error retrieving scheduling slots."
    });
  }
});

module.exports = router;
