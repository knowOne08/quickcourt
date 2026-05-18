const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  requestToJoin,
  respondToJoinRequest
} = require('../controllers/teamController');

const { protect } = require('../middleware/auth');

router.route('/')
  .get(getTeams)
  .post(protect, createTeam);

router.post('/:id/join', protect, requestToJoin);
router.put('/requests/:requestId', protect, respondToJoinRequest);

module.exports = router;
