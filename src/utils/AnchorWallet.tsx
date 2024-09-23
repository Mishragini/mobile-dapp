import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { useMemo } from "react";
import { useMobileWallet } from "./useMobileWallet";
import { useAuthorization } from "./useAuthorization";

export interface AnchorWallet {
    publicKey: PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(
        transaction: T
    ): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(
        transactions: T[]
    ): Promise<T[]>;
}

export function useAnchorWallet(): AnchorWallet | undefined {
    const { selectedAccount } = useAuthorization();
    const { signTransaction } = useMobileWallet();

    return useMemo(() => {
        if (!selectedAccount) {
            return undefined;
        }

        return {
            signTransaction: async <T extends Transaction | VersionedTransaction>(
                transaction: T
            ) => {
                return await signTransaction(transaction) as T;
            },
            signAllTransactions: async <T extends Transaction | VersionedTransaction>(
                transactions: T[]
            ) => {
                return await Promise.all(transactions.map(transaction =>
                    signTransaction(transaction)
                )) as T[];
            },
            get publicKey() {
                return selectedAccount.publicKey;
            },
        };
    }, [signTransaction, selectedAccount]);
}