const express = require('express');
const router = express.Router();
const { getCabinetInfo, updateCabinetInfo, downloadBackup } = require('../controllers/cabinet.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.route('/')
    .get(getCabinetInfo)
    .put(updateCabinetInfo);

router.get('/backup', downloadBackup);

module.exports = router;
