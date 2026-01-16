const express = require('express');
const router = express.Router();
const { isAuthenticated, isStoreManager } = require('../middleware/auth.middleware');

router.use(isAuthenticated);

router.get('/', (req, res) => res.json({ message: 'Gate routes' }));
router.get('/:id', (req, res) => res.json({ message: 'Get gate by ID' }));
router.post('/', isStoreManager, (req, res) => res.json({ message: 'Create gate' }));
router.put('/:id', isStoreManager, (req, res) => res.json({ message: 'Update gate' }));
router.delete('/:id', isStoreManager, (req, res) => res.json({ message: 'Delete gate' }));

module.exports = router;
