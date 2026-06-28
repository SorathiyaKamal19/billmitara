import { Router } from 'express';
import { createTable, deleteTable, listTables, updateTable } from '../controllers/tableController.js';
import { authorizePermission, protect } from '../middleware/auth.js';

export const tableRoutes = Router();
tableRoutes.use(protect);
tableRoutes.get('/', authorizePermission('tables', 'orders', 'billing'), listTables);
tableRoutes.post('/', authorizePermission('tables'), createTable);
tableRoutes.patch('/:id', authorizePermission('tables'), updateTable);
tableRoutes.delete('/:id', authorizePermission('tables'), deleteTable);
