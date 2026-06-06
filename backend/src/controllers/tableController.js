import { z } from 'zod';
import { Table } from '../models/Table.js';
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
