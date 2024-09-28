import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import { useHodlProgram } from './hodl/hodl-data-access';
import { AppModal } from './ui/app-modal';
import { useAuthorization } from '../utils/useAuthorization';

export function DepositTokenButton() {
    const { selectedAccount } = useAuthorization();
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [amount, setAmount] = useState('');
    const { deposit, userDepositPDA } = useHodlProgram();

    if (!selectedAccount) {
        console.error('selectedAccount is undefined');
        return <Text>Error: No account selected</Text>;
    }

    if (!deposit) {
        console.error('Deposit function is undefined');
        return <Text>Error: Deposit function not available</Text>;
    }

    const handleDeposit = async () => {
        if (!amount || !selectedAccount || !selectedAccount.publicKey) {
            console.error('Amount or userTokenAccount is missing');
            return;
        }

        try {
            await deposit.mutateAsync({
                hodlAccount: selectedAccount.publicKey,
                amount: parseInt(amount),
                userTokenAccount: selectedAccount.publicKey
            });
            setShowDepositModal(false);
            setAmount('');
        } catch (error) {
            console.error('Error depositing tokens:', error);
            // You might want to show an error message to the user here
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
                    <Text>Depositing to User Deposit Account: {userDepositPDA?.toBase58() || 'Not available'}</Text>
                    <Text>From Token Account: {selectedAccount.publicKey?.toBase58()}</Text>
                </View>
            </AppModal>
        </>
    );
}