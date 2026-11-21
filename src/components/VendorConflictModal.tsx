import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { VendorConflict } from '../types';

interface Props {
  conflict: VendorConflict | null;
  onCancel: () => void;
  onOverwrite: () => void;
}

export const VendorConflictModal: React.FC<Props> = ({ conflict, onCancel, onOverwrite }) => {
  if (!conflict) return null;

  return (
    <Modal visible={true} transparent={true} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Warning Icon Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle" size={32} color={colors.gold.primary} />
          </View>

          {/* Heading */}
          <Text style={styles.title}>Replace Cart Items?</Text>

          {/* Narrative */}
          <Text style={styles.description}>
            You already have items from{' '}
            <Text style={styles.boldText}>{conflict.currentVendor.name}</Text> in your cart.
          </Text>

          <Text style={styles.subDescription}>
            On-demand liquor orders can only be fulfilled by one licensed store at a time. Ordering from{' '}
            <Text style={styles.boldText}>{conflict.newVendor.name}</Text> will clear your current cart and add{' '}
            <Text style={styles.boldText}>{conflict.pendingProduct.name}</Text>.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonCol}>
            <TouchableOpacity style={styles.overwriteButton} onPress={onOverwrite} activeOpacity={0.8}>
              <Text style={styles.overwriteButtonText}>Clear Cart & Add Item</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel / Keep Current Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 15, 18, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gold.soft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.gold.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  subDescription: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  buttonCol: {
    width: '100%',
    gap: spacing.sm,
  },
  overwriteButton: {
    backgroundColor: colors.gold.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.gold.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  overwriteButtonText: {
    color: colors.dark.darkest,
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
