import { AnchorProvider, Program, utils, web3 } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useConnection } from "../../utils/ConnectionProvider";
import { alertAndLog } from "../../utils/alertAndLog";
import { AnchorHodl } from "../../../target/types/hodl_contract";
import { useAnchorWallet } from "../../utils/AnchorWallet";
import idl from '../../../target/idl.json'
import * as anchor from "@coral-xyz/anchor";

const HODL_PROGRAM_ID = "HDSDejM9dQ549FaWeGhbZeEEHpdRcU4Wz1TPeB2yBFQF";

export function useHodlProgram() {
    const { connection } = useConnection();
    const anchorWallet = useAnchorWallet();

    const hodlProgramId = useMemo(() => {
        return new PublicKey(HODL_PROGRAM_ID);
    }, []);

    const provider = useMemo(() => {
        if (!anchorWallet) {
            return;
        }
        return new AnchorProvider(connection, anchorWallet, {
            preflightCommitment: "confirmed",
            commitment: "processed",
        });
    }, [anchorWallet, connection]);

    const hodlProgram = useMemo(() => {
        if (!provider) {
            return;
        }

        return new Program<AnchorHodl>(
            idl as AnchorHodl,
            hodlProgramId,
            provider
        );
    }, [hodlProgramId, provider]);

    const [userDepositPDA] = useMemo(() => {
        if (!anchorWallet) return [];
        const userDepositSeed = utils.bytes.utf8.encode("user_deposit");
        return web3.PublicKey.findProgramAddressSync(
            [userDepositSeed, anchorWallet.publicKey.toBuffer()],
            hodlProgramId
        );
    }, [anchorWallet, hodlProgramId]);

    const userDeposit = useQuery({
        queryKey: ["get-user-deposit"],
        queryFn: async () => {
            if (!hodlProgram || !userDepositPDA) {
                return null;
            }

            return await hodlProgram.account.UserDeposit.fetch(userDepositPDA);
        },
    });

    const initializeHodl = useMutation({
        mutationKey: ["hodl", "initialize"],
        mutationFn: async () => {
            if (!hodlProgram || !anchorWallet) {
                throw Error("HODL program not instantiated or wallet not connected");
            }

            const hodlAccount = web3.Keypair.generate();

            return await hodlProgram.methods
                .initialize()
                .accounts({
                    hodl_account: hodlAccount.publicKey,
                    authority: anchorWallet.publicKey,
                    system_program: web3.SystemProgram.programId,
                })
                .signers([hodlAccount])
                .rpc();
        },
        onSuccess: (signature: string) => {
            return [signature, userDeposit.refetch()];
        },
        onError: (error: Error) => alertAndLog(error.name, error.message),
    });

    const deposit = useMutation({
        mutationKey: ["hodl", "deposit"],
        mutationFn: async (params: { hodlAccount: PublicKey, amount: number, userTokenAccount: PublicKey }) => {
            if (!hodlProgram || !anchorWallet || !userDepositPDA) {
                throw Error("HODL program not instantiated, wallet not connected, or user deposit PDA not found");
            }

            const [vaultPDA] = web3.PublicKey.findProgramAddressSync(
                [utils.bytes.utf8.encode("vault"), params.hodlAccount.toBuffer()],
                hodlProgramId
            );

            return await hodlProgram.methods
                .deposit(new anchor.BN(params.amount))
                .accounts({
                    hodl_account: params.hodlAccount,
                    user_deposit: userDepositPDA,
                    user_token_account: params.userTokenAccount,
                    vault: vaultPDA,
                    token_program: utils.token.TOKEN_PROGRAM_ID,
                    authority: anchorWallet.publicKey,
                    system_program: web3.SystemProgram.programId,
                })
                .rpc();
        },
        onSuccess: (signature: string) => {
            return [signature, userDeposit.refetch()];
        },
        onError: (error: Error) => alertAndLog(error.name, error.message),
    });

    const withdraw = useMutation({
        mutationKey: ["hodl", "withdraw"],
        mutationFn: async (params: { hodlAccount: PublicKey, userTokenAccount: PublicKey }) => {
            if (!hodlProgram || !anchorWallet || !userDepositPDA) {
                throw Error("HODL program not instantiated, wallet not connected, or user deposit PDA not found");
            }

            const [vaultPDA] = web3.PublicKey.findProgramAddressSync(
                [utils.bytes.utf8.encode("vault"), params.hodlAccount.toBuffer()],
                hodlProgramId
            );

            return await hodlProgram.methods
                .withdraw()
                .accounts({
                    hodl_account: params.hodlAccount,
                    user_deposit: userDepositPDA,
                    user_token_account: params.userTokenAccount,
                    vault: vaultPDA,
                    token_program: utils.token.TOKEN_PROGRAM_ID,
                    authority: anchorWallet.publicKey,
                })
                .rpc();
        },
        onSuccess: (signature: string) => {
            return [signature, userDeposit.refetch()];
        },
        onError: (error: Error) => alertAndLog(error.name, error.message),
    });

    return {
        hodlProgram,
        hodlProgramId,
        userDepositPDA,
        userDeposit,
        initializeHodl,
        deposit,
        withdraw,
    };
}