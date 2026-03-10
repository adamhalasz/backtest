import { getSql } from '../../db/client';
import type { BackendEnv } from '../../worker-types';
import type { BotRow, CreateBotInput, UpdateBotStatusInput } from './bots-types';

export const listBotsByUser = async (env: BackendEnv, userId: string): Promise<BotRow[]> => {
  const sql = getSql(env);
  const rows = await sql`
    SELECT *
    FROM bots
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return rows as BotRow[];
};

export const insertBot = async (env: BackendEnv, userId: string, payload: CreateBotInput): Promise<BotRow> => {
  const sql = getSql(env);
  const rows = await sql`
    INSERT INTO bots (
      user_id,
      name,
      strategy,
      symbol,
      exchange,
      status,
      parameters
    ) VALUES (
      ${userId},
      ${payload.name},
      ${payload.strategy},
      ${payload.symbol},
      ${payload.exchange},
      ${payload.status},
      ${JSON.stringify(payload.parameters)}::jsonb
    )
    RETURNING *
  `;

  return rows[0] as BotRow;
};

export const updateBotStatusById = async (
  env: BackendEnv,
  botId: string,
  userId: string,
  payload: UpdateBotStatusInput,
): Promise<BotRow | null> => {
  const sql = getSql(env);
  const rows = await sql`
    UPDATE bots
    SET status = ${payload.status}, updated_at = NOW()
    WHERE id = ${botId} AND user_id = ${userId}
    RETURNING *
  `;

  return (rows[0] as BotRow | undefined) ?? null;
};

export const deleteBotById = async (env: BackendEnv, botId: string, userId: string): Promise<void> => {
  const sql = getSql(env);
  await sql`
    DELETE FROM bots
    WHERE id = ${botId} AND user_id = ${userId}
  `;
};