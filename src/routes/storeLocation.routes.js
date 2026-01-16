const express = require('express');
const router = express.Router();
const { isAuthenticated, isStoreManager } = require('../middleware/auth.middleware');

router.use(isAuthenticated);

router.get('/', (req, res) => res.json({ message: 'Store location routes' }));
router.get('/:id', (req, res) => res.json({ message: 'Get location by ID' }));
router.post('/', isStoreManager, (req, res) => res.json({ message: 'Create location' }));
router.put('/:id', isStoreManager, (req, res) => res.json({ message: 'Update location' }));
router.delete('/:id', isStoreManager, (req, res) => res.json({ message: 'Delete location' }));

module.exports = router;
