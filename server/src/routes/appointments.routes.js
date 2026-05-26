const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const appointmentsCtrl = require('../controllers/appointments.controller');

// Toutes les routes nécessitent d'être connecté
router.use(auth);

router.get('/', appointmentsCtrl.getAppointments);
router.get('/queue', appointmentsCtrl.getQueue);
router.post('/', appointmentsCtrl.createAppointment);
router.put('/:id', appointmentsCtrl.updateAppointment);
router.put('/:id/status', appointmentsCtrl.updateStatus);

module.exports = router;
