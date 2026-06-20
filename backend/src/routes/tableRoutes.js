import { Router } from 'express';
import { createTable, deleteTable, listTables, updateTable } from '../controllers/tableController.js';
import { authorize, protect } from '../middleware/auth.js';

export const tableRoutes = Router();
tableRoutes.use(protect);
tableRoutes.get('/', listTables);
tableRoutes.post('/', authorize('owner', 'manager'), createTable);
tableRoutes.patch('/:id', authorize('owner'), updateTable);
tableRoutes.delete('/:id', authorize('owner', 'manager'), deleteTable);
