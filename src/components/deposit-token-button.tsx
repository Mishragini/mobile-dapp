import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { PublicKey } from '@solana/web3.js';
import { useHodlProgram } from './hodl/hodl-data-access';
import { AppModal } from './ui/app-modal';

interface DepositTokenButtonProps {
    address: PublicKey;
    hodlAccount: PublicKey;
    userTokenAccount: PublicKey;
}

export function DepositTokenButton({ address, hodlAccount, userTokenAccount }: DepositTokenButtonProps) {
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [amount, setAmount] = useState('');
    const { deposit } = useHodlProgram();

    const handleDeposit = async () => {
        if (!amount) return;

        try {
            await deposit.mutateAsync({
                hodlAccount,
                amount: parseInt(amount),
                userTokenAccount,
            });
            setShowDepositModal(false);
            setAmount('');
        } catch (error) {
            console.error('Error depositing tokens:', error);
        }
    };

    return (
        <>
            <Button mode="contained" onPress={() => setShowDepositModal(true)}>
                Deposit Tokens
            </Button>

            <AppModal
                title="Deposit Tokens"
                show={showDepositModal}
                hide={() => setShowDepositModal(false)}
                submit={handleDeposit}
                submitLabel="Deposit"
                submitDisabled={!amount || deposit.isPending}
            >
                <View style={{ padding: 20 }}>
                    <TextInput
                        label="Amount"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        mode="outlined"
                        style={{ marginBottom: 20 }}
                    />
                    <Text>Depositing to HODL Account: {hodlAccount.toBase58()}</Text>
                    <Text>From Token Account: {userTokenAccount.toBase58()}</Text>
                </View>
            </AppModal>
        </>
    );
}