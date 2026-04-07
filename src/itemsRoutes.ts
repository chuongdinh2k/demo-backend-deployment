import { Router, type Request, type Response } from "express";
import type { Pool } from "mysql2/promise";
import { asyncRoute } from "./asyncRoute.js";
import {
  createItem,
  deleteItem,
  getItemById,
  listItems,
  updateItem,
} from "./itemsRepository.js";
import type { ItemCreateBody, ItemUpdateBody } from "./types.js";

function parseIdParam(req: Request): number {
  const raw = req.params.id;
  const id = Number.parseInt(raw, 10);
  if (Number.isNaN(id) || id < 1) {
    throw new Error(`Invalid item id: ${raw}`);
  }
  return id;
}

function readCreateBody(req: Request): ItemCreateBody {
  const title = req.body?.title;
  const description = req.body?.description;
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("Field 'title' is required and must be a non-empty string");
  }
  if (description !== null && description !== undefined) {
    if (typeof description !== "string") {
      throw new Error("Field 'description' must be a string or null");
    }
    return { title: title.trim(), description };
  }
  return { title: title.trim(), description: null };
}

function readUpdateBody(req: Request): ItemUpdateBody {
  return readCreateBody(req);
}

export function createItemsRouter(pool: Pool): Router {
  const router = Router();

  router.get(
    "/",
    asyncRoute(async (_req: Request, res: Response) => {
      const items = await listItems(pool);
      res.json(items);
    }),
  );

  router.get(
    "/:id",
    asyncRoute(async (req: Request, res: Response) => {
      const id = parseIdParam(req);
      const item = await getItemById(pool, id);
      if (item === null) {
        res.status(404).json({ error: "Item not found", id });
        return;
      }
      res.json(item);
    }),
  );

  router.post(
    "/",
    asyncRoute(async (req: Request, res: Response) => {
      const body = readCreateBody(req);
      const insertId = await createItem(pool, body);
      const created = await getItemById(pool, insertId);
      if (created === null) {
        throw new Error(`Failed to load item after insert, id=${insertId}`);
      }
      res.status(201).json(created);
    }),
  );

  router.put(
    "/:id",
    asyncRoute(async (req: Request, res: Response) => {
      const id = parseIdParam(req);
      const body = readUpdateBody(req);
      const updated = await updateItem(pool, id, body);
      if (!updated) {
        res.status(404).json({ error: "Item not found", id });
        return;
      }
      const item = await getItemById(pool, id);
      if (item === null) {
        throw new Error(`Item missing after update, id=${id}`);
      }
      res.json(item);
    }),
  );

  router.delete(
    "/:id",
    asyncRoute(async (req: Request, res: Response) => {
      const id = parseIdParam(req);
      const removed = await deleteItem(pool, id);
      if (!removed) {
        res.status(404).json({ error: "Item not found", id });
        return;
      }
      res.status(204).send();
    }),
  );

  return router;
}
