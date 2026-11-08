import "server-only";

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

export const VOLUNTEER_REWARD_SOL = 0.01;

export async function sendDevnetVolunteerReward(recipientAddress: string) {
  const rpcUrl =
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const rpcHost = new URL(rpcUrl).hostname.toLowerCase();
  if (!rpcHost.includes("devnet")) {
    throw new Error("Volunteer rewards are restricted to Solana Devnet.");
  }

  const treasurySecret = process.env.SOLANA_TREASURY_SECRET;
  if (!treasurySecret) {
    throw new Error("SOLANA_TREASURY_SECRET is not configured.");
  }

  const secretValue: unknown = JSON.parse(treasurySecret);
  if (
    !Array.isArray(secretValue) ||
    !secretValue.every(
      (byte): byte is number =>
        Number.isInteger(byte) && byte >= 0 && byte <= 255,
    )
  ) {
    throw new Error("SOLANA_TREASURY_SECRET must be a JSON byte array.");
  }

  const treasurySecretKey = Uint8Array.from(secretValue);
  const treasury = await Keypair.fromSecretKey(treasurySecretKey);
  const recipient = new PublicKey(recipientAddress);
  const connection = new Connection(rpcUrl, "confirmed");
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: recipient,
      lamports: Math.round(VOLUNTEER_REWARD_SOL * LAMPORTS_PER_SOL),
    }),
  );

  return sendAndConfirmTransaction(connection, transaction, [treasury]);
}

export function isValidSolanaAddress(address: string) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
