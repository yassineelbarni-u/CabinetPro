const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sessionsCtrl = require('../controllers/sessions.controller');

router.use(auth);

router.post('/', sessionsCtrl.createSession);
router.get('/patient/:patient_id', sessionsCtrl.getPatientHistory);

module.exports = router;
