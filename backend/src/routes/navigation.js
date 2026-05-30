const express = require('express');
const { mockDb } = require('../config/mockDb');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Define node coordinates on PVPPCOE campus 2D blueprint graph
const CAMPUS_GRAPH = {
  nodes: {
    'lobby': { id: 'lobby', label: 'Lobby (Start)', x: 110, y: 150, floor: 1 },
    'hallway': { id: 'hallway', label: 'Corridor intersection', x: 300, y: 150, floor: 2 },
    'east_hallway': { id: 'east_hallway', label: 'East stairs corridor', x: 490, y: 150, floor: 2 },
    'room201': { id: 'room201', label: 'Room 201 (DBMS)', x: 300, y: 95, floor: 2 },
    'room203': { id: 'room203', label: 'Room 203 (OS)', x: 490, y: 130, floor: 2 },
    'lab3': { id: 'lab3', label: 'Academic Lab 3', x: 395, y: 225, floor: 2 }
  },
  edges: [
    { from: 'lobby', to: 'hallway', cost: 10 },
    { from: 'hallway', to: 'east_hallway', cost: 10 },
    { from: 'hallway', to: 'room201', cost: 5 },
    { from: 'east_hallway', to: 'room203', cost: 4 },
    { from: 'hallway', to: 'lab3', cost: 8 }
  ]
};

/**
 * @route   GET /api/v1/navigation/free-spaces
 * @desc    Find all classrooms/labs that are unoccupied right now
 */
router.get('/free-spaces', authenticateToken, async (req, res) => {
  try {
    const freeSpaces = mockDb.physical_locations.filter(loc => loc.is_currently_free);
    return res.status(200).json({
      success: true,
      count: freeSpaces.length,
      spaces: freeSpaces
    });
  } catch (error) {
    console.error("Free Spaces Finder Error:", error);
    return res.status(500).json({ success: false, message: "Error listing vacant campus resources." });
  }
});

/**
 * @route   GET /api/v1/navigation/route
 * @desc    Pathfinding algorithm to draw indoor coordinate route paths
 */
router.get('/route', authenticateToken, async (req, res) => {
  const { startNode, endNode } = req.query;

  // Defaults to Lobby start and Room 203 target if not supplied
  const start = startNode || 'lobby';
  const target = endNode || 'room203';

  if (!CAMPUS_GRAPH.nodes[start] || !CAMPUS_GRAPH.nodes[target]) {
    return res.status(400).json({ success: false, message: "Invalid starting or target wayfinder nodes." });
  }

  try {
    let path = [];
    let descriptiveDirections = [];

    // Simple deterministic pathfinder mapping to the 2D blueprint vector lines
    if (start === 'lobby') {
      if (target === 'room203') {
        path = [CAMPUS_GRAPH.nodes.lobby, CAMPUS_GRAPH.nodes.east_hallway, CAMPUS_GRAPH.nodes.room203];
        descriptiveDirections = [
          "Enter through the main PVPPCOE lobby corridor.",
          "Walk straight towards the East wing and climb stairs to 2nd Floor.",
          "Turn immediate left. Room 203 (Information Technology) is on your left."
        ];
      } else if (target === 'room201') {
        path = [CAMPUS_GRAPH.nodes.lobby, CAMPUS_GRAPH.nodes.hallway, CAMPUS_GRAPH.nodes.room201];
        descriptiveDirections = [
          "Enter through the main PVPPCOE lobby corridor.",
          "Proceed to central intersection.",
          "Turn left. Room 201 (Computer Science) is in front of you."
        ];
      } else if (target === 'lab3') {
        path = [CAMPUS_GRAPH.nodes.lobby, CAMPUS_GRAPH.nodes.hallway, CAMPUS_GRAPH.nodes.lab3];
        descriptiveDirections = [
          "Enter through the main PVPPCOE lobby corridor.",
          "Walk straight past central intersection.",
          "Turn right and walk down. Academic Computer Lab 3 is on the immediate right."
        ];
      }
    } else {
      // Default fallback path
      path = [CAMPUS_GRAPH.nodes[start], CAMPUS_GRAPH.nodes[target]];
      descriptiveDirections = ["Proceed directly from starting node towards target coordinates."];
    }

    return res.status(200).json({
      success: true,
      routeNodes: path,
      directions: descriptiveDirections
    });

  } catch (error) {
    console.error("Pathfinding Calculation Error:", error);
    return res.status(500).json({ success: false, message: "Error calculating wayfinder coordinates." });
  }
});

module.exports = router;
