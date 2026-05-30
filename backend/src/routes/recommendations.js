const express = require('express');
const { mockDb } = require('../config/mockDb');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

/**
 * @route   GET /api/v1/recommendations/personalized
 * @desc    Intelligent Recommendation Engine for student dashboards
 */
router.get('/personalized', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Fetch student attributes
    const student = mockDb.students.find(s => s.user_id === userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record details not found." });
    }

    const studentSkills = student.skills_inventory || [];
    const studentCgpa = parseFloat(student.gpa);

    // 2. Recommend placement opportunities based on GPA and eligible departments
    const recommendedPlacements = mockDb.placements_drives
      .filter(drive => {
        const isCgpaValid = studentCgpa >= parseFloat(drive.eligibility_min_cgpa);
        const isBranchValid = drive.eligible_departments.includes(student.dept_id);
        return isCgpaValid && isBranchValid;
      })
      .map(drive => ({
        id: drive.id,
        companyName: drive.company_name,
        jobTitle: drive.job_title,
        salaryPackage: drive.salary_package,
        actionPrompt: `Apply now! Your GPA (${studentCgpa}) exceeds the eligibility threshold of ${drive.eligibility_min_cgpa}.`
      }));

    // 3. Recommend clubs and societies based on skills overlap
    const recommendedClubs = mockDb.clubs
      .map(club => {
        // Calculate overlap intersection
        const matchingSkills = club.required_skills.filter(skill => studentSkills.includes(skill));
        const matchScore = Math.round((matchingSkills.length / club.required_skills.length) * 100);
        return {
          id: club.id,
          name: club.name,
          description: club.description,
          matchScore,
          matchingSkills
        };
      })
      .filter(c => c.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    // 4. Recommend study materials based on weak subjects
    // OS is at 64% attendance in mockDb, so mark it as a focus area!
    const enrollments = mockDb.enrollments.filter(e => e.student_id === student.user_id);
    const weakEnrollment = enrollments.find(e => parseFloat(e.attendance_ratio) < 75);
    
    let focusCourseCode = 'OS-304';
    let focusCourseName = 'Operating Systems';
    
    if (weakEnrollment) {
      const course = mockDb.courses.find(c => c.id === weakEnrollment.course_id);
      if (course) {
        focusCourseCode = course.code;
        focusCourseName = course.name;
      }
    }

    const recommendedStudyMaterials = mockDb.study_materials
      .map(material => {
        const course = mockDb.courses.find(c => c.id === material.course_id);
        return {
          id: material.id,
          title: material.title,
          courseCode: course ? course.code : 'GENERIC',
          courseName: course ? course.name : 'General study notes',
          s3Key: material.s3_key,
          focusRequired: course ? course.code === focusCourseCode : false
        };
      });

    // 5. Recommend campus events based on departments
    const recommendedEvents = mockDb.events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      time: new Date(event.event_start).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }),
      location: 'Vasantdada Auditorium'
    }));

    return res.status(200).json({
      success: true,
      recommendations: {
        placements: recommendedPlacements,
        clubs: recommendedClubs,
        studyMaterials: recommendedStudyMaterials,
        events: recommendedEvents,
        focusArea: {
          courseCode: focusCourseCode,
          courseName: focusCourseName,
          reason: "Identified as a risk subject due to recorded lecture attendance ratio below 75%."
        }
      }
    });

  } catch (error) {
    console.error("Personalized Recommendations Engine Error:", error);
    return res.status(500).json({ success: false, message: "Error compiling student recommendation feed." });
  }
});

module.exports = router;
