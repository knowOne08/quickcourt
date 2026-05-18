const Team = require('../models/Team');
const TeamJoinRequest = require('../models/TeamJoinRequest');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
  try {
    const { 
      name, 
      sport, 
      maxPlayers, 
      skillLevel, 
      venue, 
      booking, 
      date, 
      startTime, 
      endTime,
      description,
      teamType
    } = req.body;

    // Create team with captain as first member
    const team = await Team.create({
      name,
      sport,
      captain: req.user.id,
      members: [req.user.id],
      maxPlayers,
      skillLevel,
      venue,
      booking,
      date,
      startTime,
      endTime,
      description,
      teamType
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    logger.error(`Error creating team: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get all teams with filters
// @route   GET /api/teams
// @access  Public
exports.getTeams = async (req, res) => {
  try {
    const { sport, skillLevel, status, venue } = req.query;
    let query = {};

    if (sport) query.sport = sport;
    if (skillLevel) query.skillLevel = skillLevel;
    if (status) query.status = status;
    if (venue) query.venue = venue;

    const teams = await Team.find(query)
      .populate('captain', 'name avatar')
      .populate('venue', 'name location')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    logger.error(`Error fetching teams: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Request to join a team
// @route   POST /api/teams/:id/join
// @access  Private
exports.requestToJoin = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    if (team.status === 'full') {
      return res.status(400).json({
        success: false,
        error: 'Team is already full'
      });
    }

    if (team.members.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: 'You are already a member of this team'
      });
    }

    // Check for existing pending request
    const existingRequest = await TeamJoinRequest.findOne({
      team: team._id,
      user: req.user.id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'Join request already sent'
      });
    }

    const { message, preferredPosition } = req.body;

    const joinRequest = await TeamJoinRequest.create({
      team: team._id,
      user: req.user.id,
      message,
      preferredPosition
    });

    // Create notification for team captain
    await Notification.create({
      recipient: team.captain._id,
      sender: req.user.id,
      type: 'JOIN_REQUEST',
      title: 'New Join Request',
      message: `${req.user.name} wants to join your team: ${team.name}`,
      data: {
        teamId: team._id
      }
    });

    // Send Email to Captain
    const User = require('../models/User');
    const captain = await User.findById(team.captain);
    if(captain && captain.email) {
       const emailService = require('../services/emailService');
       emailService.sendTeamJoinRequestEmail(
          captain.email, 
          captain.name, 
          req.user.name, 
          team.name
       ).catch(e => logger.error('Failed to send team request email: ' + e.message));
    }

    res.status(201).json({
      success: true,
      message: 'Join request sent successfully'
    });
  } catch (error) {
    logger.error(`Error requesting to join: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Respond to join request (Approve/Reject)
// @route   PUT /api/teams/requests/:requestId
// @access  Private (Captain only)
exports.respondToJoinRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const request = await TeamJoinRequest.findById(req.params.requestId).populate('team');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Check if user is the captain of the team
    if (request.team.captain.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to respond to this request'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Request already responded to'
      });
    }

    request.status = status;
    await request.save();

    if (status === 'approved') {
      const team = await Team.findById(request.team._id);
      
      if (team.members.length >= team.maxPlayers) {
        return res.status(400).json({
          success: false,
          error: 'Team is already full'
        });
      }

      team.members.push(request.user);
      
      if (team.members.length === team.maxPlayers) {
        team.status = 'full';
      }
      
      await team.save();

      // Notify requester
      await Notification.create({
        recipient: request.user,
        sender: req.user.id,
        type: 'REQUEST_APPROVED',
        title: 'Team Join Approved',
        message: `Your request to join ${team.name} has been approved!`,
        data: {
          teamId: team._id
        }
      });
    } else {
      // Notify requester of rejection
      await Notification.create({
        recipient: request.user,
        sender: req.user.id,
        type: 'REQUEST_REJECTED',
        title: 'Team Join Rejected',
        message: `Your request to join ${request.team.name} was rejected.`,
        data: {
          teamId: request.team._id
        }
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    logger.error(`Error responding to request: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
