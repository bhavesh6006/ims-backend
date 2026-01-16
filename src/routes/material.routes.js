const express = require('express');
const router = express.Router();
const { isAuthenticated, isStorekeeper } = require('../middleware/auth.middleware');

// Placeholder routes - implement controllers as needed
router.use(isAuthenticated);

router.get('/', (req, res) => res.json({ message: 'Material routes' }));
router.get('/:id', (req, res) => res.json({ message: 'Get material by ID' }));
router.post('/', isStorekeeper, (req, res) => res.json({ message: 'Create material' }));
router.put('/:id', isStorekeeper, (req, res) => res.json({ message: 'Update material' }));
router.delete('/:id', isStorekeeper, (req, res) => res.json({ message: 'Delete material' }));

module.exports = router;
