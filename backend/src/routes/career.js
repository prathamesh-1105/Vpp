const express = require('express');
const { mockDb } = require('../config/mockDb');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

/**
 * @route   GET /api/v1/career/drives
 * @desc    Fetch placement drives and dynamically evaluate student eligibility
 */
router.get('/drives', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    // 1. Fetch student information from database pool or mockDb
    const student = mockDb.students.find(s => s.user_id === userId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    // 2. Map and evaluate eligibility across all registered placement drives
    const enrichedDrives = mockDb.placements_drives.map(drive => {
      const isCgpaValid = parseFloat(student.gpa) >= parseFloat(drive.eligibility_min_cgpa);
      const isBranchValid = drive.eligible_departments.includes(student.dept_id);
      
      const reasons = [];
      if (!isCgpaValid) reasons.push(`Requires minimum CGPA of ${drive.eligibility_min_cgpa} (Your GPA: ${student.gpa})`);
      if (!isBranchValid) reasons.push("Your department branch is not eligible for this drive");

      return {
        ...drive,
        eligible: isCgpaValid && isBranchValid,
        ineligibilityReason: reasons.join(' • ')
      };
    });

    return res.status(200).json({
      success: true,
      studentCgpa: student.gpa,
      drives: enrichedDrives
    });
  } catch (error) {
    console.error("Fetch Placements Error:", error);
    return res.status(500).json({ success: false, message: "Server error listing placements." });
  }
});

/**
 * @route   POST /api/v1/career/analyze-resume
 * @desc    AI Resume Scanner & Skill Gap Analyzer
 */
router.post('/analyze-resume', authenticateToken, async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ success: false, message: "Missing resume text or job description context." });
  }

  try {
    let matchScore = 75;
    let strengths = ["Proficient in HTML/CSS and frontend layouts", "Excellent understanding of basic relational database schemas and queries"];
    let skillGaps = ["Redis caching protocols", "Cloud architecture orchestration frameworks"];
    let recommendations = ["Review your Operating Systems notes on Thread Synchronization", "Book Workstation slots in CSE Lab 3 to practice Cloud deployments"];

    // 1. If Gemini API Key is active, perform a live assessment
    if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
      try {
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a career development expert. Review the candidate's resume and compare it against the job description.
                Resume: "${resumeText}"
                Job Description: "${jobDescription}"
                
                Respond in pure JSON matching this exact structure (no markdown wrappers, no backticks):
                {
                  "matchScore": number (0 to 100),
                  "strengths": ["strength1", "strength2"],
                  "skillGaps": ["gap1", "gap2"],
                  "recommendations": ["rec1", "rec2"]
                }`
              }]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        const json = await response.json();
        const rawText = json.candidates[0].content.parts[0].text;
        const aiOutput = JSON.parse(rawText.trim());
        
        matchScore = aiOutput.matchScore || matchScore;
        strengths = aiOutput.strengths || strengths;
        skillGaps = aiOutput.skillGaps || skillGaps;
        recommendations = aiOutput.recommendations || recommendations;
      } catch (err) {
        console.warn("AI generation failed, falling back to simulated analysis.", err);
      }
    } else {
      // 2. Cyber Gold Realistic Parser (Simulated NLP engine based on keywords)
      const resumeLower = resumeText.toLowerCase();
      const jobLower = jobDescription.toLowerCase();

      if (jobLower.includes('cloud') || jobLower.includes('azure') || jobLower.includes('aws')) {
        matchScore = resumeLower.includes('javascript') ? 84 : 60;
        strengths = ["Strong foundational familiarity with SQL database design", "Hands-on scripting with JavaScript/Node.js"];
        skillGaps = ["Cloud deployment environments (Azure/AWS)", "Redis cache cluster distributions"];
        recommendations = ["Review Operating Systems Room 203 notes on Virtualization", "Schedule learning hours in COMP Lab 3"];
      } else if (jobLower.includes('redis') || jobLower.includes('cache')) {
        matchScore = 70;
        strengths = ["Database normalization and index models"];
        skillGaps = ["In-memory Redis database setups", "Advanced memory synchronization models"];
        recommendations = ["Read DBMS-302 notes on Indexing and caching architectures", "Join PVPPCOE Coding Club to collaborate on scalable structures"];
      }
    }

    return res.status(200).json({
      success: true,
      assessment: {
        matchScore,
        strengths,
        skillGaps,
        recommendations
      }
    });

  } catch (error) {
    console.error("Resume Analysis Server Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error analyzing resume." });
  }
});

/**
 * @route   POST /api/v1/career/mock-interview
 * @desc    Simulate interactive technical mock interview responses
 */
router.post('/mock-interview', authenticateToken, async (req, res) => {
  const { userMessage, chatHistory } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!userMessage) {
    return res.status(400).json({ success: false, message: "Please provide a valid response message." });
  }

  try {
    let aiResponse = "Excellent point. In systems design, scaling requires distributing operations. Let's discuss database index types — how does a B-Tree index speed up a query?";

    if (geminiKey && geminiKey !== 'your_gemini_api_key_here') {
      try {
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        
        const historyText = (chatHistory || []).map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.text}`).join('\n');
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert technical interviewer at a premium software firm. You are interviewing a student from PVPPCOE Mumbai for a Cloud Engineering role.
                Previous conversation history:
                ${historyText}
                
                Candidate's response: "${userMessage}"
                
                Provide a short, professional interviewer follow-up. Acknowledge their statement, evaluate their knowledge briefly, and ask one relevant follow-up question regarding Operating Systems, DBMS or data structures.`
              }]
            }]
          })
        });

        const json = await response.json();
        aiResponse = json.candidates[0].content.parts[0].text.trim();
      } catch (err) {
        console.warn("Gemini Mock Interview failed, loading in-memory response.");
      }
    } else {
      // Interactive simulated interviewer dialogues
      const msgLower = userMessage.toLowerCase();
      if (msgLower.includes('index') || msgLower.includes('b-tree') || msgLower.includes('database')) {
        aiResponse = "That is correct. B-Trees speed up lookups from O(N) to O(log N). Moving onto Operating Systems — what is process starvation, and how can priority aging prevent it?";
      } else if (msgLower.includes('starvation') || msgLower.includes('aging') || msgLower.includes('priority')) {
        aiResponse = "Spot on! Aging gradually increases priority to prevent starvation of low-priority threads. Our final question: can you explain why we use Redis caching adjacent to primary databases?";
      } else if (msgLower.includes('redis') || msgLower.includes('cache') || msgLower.includes('latency')) {
        aiResponse = "Brilliant! Redis stores active key-value datasets in RAM, lowering read latencies to sub-milliseconds. That concludes our mock session. I will compile your detailed report for the Career Hub dashboard!";
      }
    }

    return res.status(200).json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error("Mock Interview Error:", error);
    return res.status(500).json({ success: false, message: "Error simulating mock interview." });
  }
});

module.exports = router;
