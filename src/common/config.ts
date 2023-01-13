import dotenv from 'dotenv';
dotenv.config();

export const config = {
  rpcUrl: process.env.RPC_URL ?? '',
};
