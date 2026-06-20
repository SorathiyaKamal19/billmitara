import { z } from 'zod';
import { Table } from '../models/Table.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const tableSchema = z.object({ name: z.string().min(1), capacity: z.number().int().positive().default(4), zone: z.string().default('Main Floor') });

export const listTables = asyncHandler(async (req, res) => {
  const tables = await Table.find({ restaurant: req.user.restaurant }).populate('currentOrder').sort({ zone: 1, name: 1 });
  res.json(tables);
});

export const createTable = asyncHandler(async (req, res) => {
  const input = tableSchema.parse(req.body);
  const table = await Table.create({ ...input, restaurant: req.user.restaurant });
  res.status(201).json(table);
});

export const updateTable = asyncHandler(async (req, res) => {
  const input = tableSchema.partial().extend({ status: z.enum(['available', 'running', 'reserved', 'cleaning']).optional() }).parse(req.body);
  const table = await Table.findOneAndUpdate({ _id: req.params.id, restaurant: req.user.restaurant }, input, { new: true });
  res.json(table);
});

export const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findOne({ _id: req.params.id, restaurant: req.user.restaurant });
  if (!table) throw new ApiError(404, 'Table not found');
  if (table.currentOrder || table.status === 'running') {
    throw new ApiError(409, 'Complete or cancel the running order before deleting this table');
  }
  await table.deleteOne();
  res.status(204).send();
});
