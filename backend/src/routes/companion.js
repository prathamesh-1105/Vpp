const express = require('express');
const { mockDb } = require('../config/mockDb');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

/**
 * @route   POST /api/v1/companion/summarize
 * @desc    AI concept summarizer for uploaded materials
 */
router.post('/summarize', authenticateToken, async (req, res) => {
  const { notesText } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!notesText) {
    return res.status(400).json({ success: false, message: "Please provide notes text content to summarize." });
  }

  try {
    let summary = "1. **Clustered Indexes**: Relational databases enforce Primary Keys, creating structured B-Trees containing physical table rows. Index pages drastically lower read latencies.\n2. **ACID Properties**: Transactions execute atomically, maintaining consistency, isolation, and durability boundaries.";

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
                text: `You are an academic professor. Summarize the following lecture notes text into three bullet points with bold key headings:
                Notes: "${notesText}"`
              }]
            }]
          })
        });

        const json = await response.json();
        summary = json.candidates[0].content.parts[0].text.trim();
      } catch (err) {
        console.warn("AI summarization failed, returning simulated output.");
      }
    }

    return res.status(200).json({
      success: true,
      summary: summary
    });
  } catch (error) {
    console.error("Summarization Error:", error);
    return res.status(500).json({ success: false, message: "Error generating concept summary." });
  }
});

/**
 * @route   POST /api/v1/companion/quiz
 * @desc    Generates practice multiple-choice questions
 */
router.post('/quiz', authenticateToken, async (req, res) => {
  const { notesText } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    let quizzes = [
      {
        question: "Which database index structures contain the actual data rows of the table physical pages?",
        options: ["Clustered Index", "Non-Clustered Index", "Dense Index", "Sparse Index"],
        correctAnswer: "Clustered Index",
        explanation: "In SQL, a clustered index determines the physical order of data in the table, storing the actual rows directly in the B-Tree leaf nodes."
      },
      {
        question: "In CPU scheduling, which scheduling algorithms are prone to process starvation?",
        options: ["First-Come, First-Served", "Round Robin", "Shortest Job First (non-preemptive)", "Priority Scheduling"],
        correctAnswer: "Priority Scheduling",
        explanation: "Priority Scheduling can cause low-priority processes to wait indefinitely, resulting in process starvation."
      },
      {
        question: "What mechanism is utilized in operating systems to resolve process starvation inside priority schedules?",
        options: ["Aging", "Thread Pooling", "Semaphores", "Virtual Memory"],
        correctAnswer: "Aging",
        explanation: "Aging is a technique of gradually increasing the priority of processes that wait in the system for a long time."
      }
    ];

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
                text: `You are an academic examiner. Generate 3 multiple-choice questions from the notes.
                Notes: "${notesText || 'Database indexes and OS scheduling'}"
                
                Respond in pure JSON matching this exact structure (no markdown wrappers, no backticks):
                [
                  {
                    "question": "Question text...",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correctAnswer": "Exact string of correct option",
                    "explanation": "Explanation..."
                  }
                ]`
              }]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        const json = await response.json();
        const rawText = json.candidates[0].content.parts[0].text;
        quizzes = JSON.parse(rawText.trim());
      } catch (err) {
        console.warn("AI Quiz generation failed, utilizing robust mock data.");
      }
    }

    return res.status(200).json({
      success: true,
      quizzes: quizzes
    });
  } catch (error) {
    console.error("Quiz Generator Error:", error);
    return res.status(500).json({ success: false, message: "Error generating practice quizzes." });
  }
});

/**
 * @route   POST /api/v1/companion/flashcards
 * @desc    Auto-generate concept vocabulary cards
 */
router.post('/flashcards', authenticateToken, async (req, res) => {
  const { notesText } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY;

  try {
    let cards = [
      { id: 1, question: "Preemptive Scheduling", answer: "A CPU scheduling mechanism where active thread execution can be interrupted to relocate processing cycles to higher priority tasks." },
      { id: 2, question: "B-Tree Database Index", label: "DBMS", answer: "A self-balancing search tree data structure that maintains sorted data and allows logarithmic search, sequential access, insertions, and deletions." },
      { id: 3, question: "ACID Isolation", label: "DBMS", answer: "A property specifying that concurrent transaction executions leave the database in the same state as if they were run sequentially." }
    ];

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
                text: `You are an academic tutor. Extract 3 key vocabulary terms and their conceptual definitions from the notes.
                Notes: "${notesText || 'Operating systems memory virtualization and DBMS transactions'}"
                
                Respond in pure JSON matching this exact structure (no markdown wrappers, no backticks):
                [
                  {
                    "id": number,
                    "question": "The conceptual term...",
                    "answer": "Detailed definition..."
                  }
                ]`
              }]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        const json = await response.json();
        const rawText = json.candidates[0].content.parts[0].text;
        cards = JSON.parse(rawText.trim());
      } catch (err) {
        console.warn("Flashcard AI generation failed, utilizing standard mock data.");
      }
    }

    return res.status(200).json({
      success: true,
      flashcards: cards
    });
  } catch (error) {
    console.error("Flashcards Generator Error:", error);
    return res.status(500).json({ success: false, message: "Error generating vocabulary flashcards." });
  }
});

module.exports = router;
