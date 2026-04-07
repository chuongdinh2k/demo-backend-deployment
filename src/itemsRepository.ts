import type { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { ItemCreateBody, ItemRow, ItemUpdateBody } from "./types.js";

type ItemRowPacket = ItemRow & RowDataPacket;

export async function listItems(pool: Pool): Promise<ItemRow[]> {
  const [rows] = await pool.query<ItemRowPacket[]>(
    "SELECT id, title, description, created_at FROM items ORDER BY id ASC",
  );
  return rows;
}

export async function getItemById(
  pool: Pool,
  id: number,
): Promise<ItemRow | null> {
  const [rows] = await pool.query<ItemRowPacket[]>(
    "SELECT id, title, description, created_at FROM items WHERE id = ? LIMIT 1",
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}

export async function createItem(
  pool: Pool,
  body: ItemCreateBody,
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO items (title, description) VALUES (?, ?)",
    [body.title, body.description],
  );
  return result.insertId;
}

export async function updateItem(
  pool: Pool,
  id: number,
  body: ItemUpdateBody,
): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE items SET title = ?, description = ? WHERE id = ?",
    [body.title, body.description, id],
  );
  return result.affectedRows > 0;
}

export async function deleteItem(pool: Pool, id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "DELETE FROM items WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}
