import { Router } from 'express';
import { createTable, listTables, updateTable } from '../controllers/tableController.js';
import { authorize, protect } from '../middleware/auth.js';

export const tableRoutes = Router();
tableRoutes.use(protect);
tableRoutes.get('/', listTables);
tableRoutes.post('/', authorize('owner'), createTable);
tableRoutes.patch('/:id', authorize('owner'), updateTable);
