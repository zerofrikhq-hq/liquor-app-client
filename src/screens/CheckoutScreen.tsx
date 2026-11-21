import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order, UserAddress } from '../types';

interface Props {
  onBack: () => void;
  onOrderPlaced: (order: Order) => void;
}

type AddressLabelType = 'Home' | 'Work' | 'Other';

export const CheckoutScreen: React.FC<Props> = ({ onBack, onOrderPlaced }) => {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new' | null>(null);

  // Delivery form inputs - DO NOT prefill address, let customer type fresh
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>(user?.phone_number || '');
  const [instructions, setInstructions] = useState<string>('');
  const [isAgeConfirmed, setIsAgeConfirmed] = useState<boolean>(true);

  // Save address option state
  const [saveAddressOption, setSaveAddressOption] = useState<boolean>(true);
  const [selectedLabel, setSelectedLabel] = useState<AddressLabelType>('Home');
  const [customLabel, setCustomLabel] = useState<string>('');

  // Stripe Card form inputs
  const [cardNumber, setCardNumber] = useState<string>('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('123');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch saved addresses from DB on mount
  useEffect(() => {
    let isMounted = true;
    const fetchAddresses = async () => {
      if (!user?.id) return;
      setIsLoadingAddresses(true);
      try {
        const res = await api.fetchUserAddresses(user.id);
        if (isMounted && res.success && res.addresses) {
          setSavedAddresses(res.addresses);
          // If customer has saved addresses, do not prefill new address input;
          // default selection is entering fresh or selecting from list
          if (res.addresses.length > 0) {
            // Check if there is a default address
            const defaultAddr = res.addresses.find((a) => a.isDefault) || res.addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setAddress(defaultAddr.addressLine1);
            if (defaultAddr.deliveryInstructions) {
              setInstructions(defaultAddr.deliveryInstructions);
            }
            if (defaultAddr.contactPhone) {
              setPhone(defaultAddr.contactPhone);
            }
          } else {
            setSelectedAddressId('new');
          }
        }
      } catch (err) {
        console.warn('Failed to load saved addresses:', err);
        if (isMounted) {
          setSelectedAddressId('new');
        }
      } finally {
        if (isMounted) {
          setIsLoadingAddresses(false);
        }
      }
    };

    fetchAddresses();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleSelectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setAddress(addr.addressLine1);
    setInstructions(addr.deliveryInstructions || '');
    if (addr.contactPhone) {
      setPhone(addr.contactPhone);
    }
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setAddress('');
    setInstructions('');
  };

  const handleDeleteSavedAddress = async (addrId: number, e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (!user?.id) return;

    try {
      await api.deleteUserAddress(user.id, addrId);
      const remaining = savedAddresses.filter((a) => a.id !== addrId);
      setSavedAddresses(remaining);
      if (selectedAddressId === addrId) {
        if (remaining.length > 0) {
          handleSelectSavedAddress(remaining[0]);
        } else {
          handleSelectNewAddress();
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not delete address.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to place an order.');
      return;
    }

    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setErrorMessage('Please enter your delivery address.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setErrorMessage('Please enter your contact phone number.');
      return;
    }

    if (!isAgeConfirmed) {
      setErrorMessage('You must confirm you are 18 years or older.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. If customer typed a new address and selected "Save this address", persist to database
      if (selectedAddressId === 'new' && saveAddressOption) {
        try {
          const finalLabel =
            selectedLabel === 'Other' && customLabel.trim()
              ? customLabel.trim()
              : selectedLabel;

          await api.saveUserAddress(user.id, {
            addressLine1: trimmedAddress,
            label: finalLabel,
            deliveryInstructions: instructions.trim(),
            contactPhone: trimmedPhone,
            isDefault: savedAddresses.length === 0,
          });
        } catch (saveErr) {
          console.warn('Could not save address to profile:', saveErr);
          // Non-blocking: proceed with order placement
        }
      }

      // 2. Place order
      const res = await api.placeOrder({
        userId: user.id,
        deliveryAddress: trimmedAddress,
        contactPhone: trimmedPhone,
        deliveryInstructions: instructions.trim(),
        paymentMethod: 'stripe',
        stripePaymentIntentId: `pi_test_${Date.now()}`,
      });

      if (res.success && res.order) {
        await refreshCart();
        onOrderPlaced(res.order);
      } else {
        setErrorMessage(res.message || 'Failed to place order.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLabelIcon = (label: string): keyof typeof Ionicons.glyphMap => {
    const l = (label || '').toLowerCase();
    if (l === 'home') return 'home';
    if (l === 'work' || l === 'office') return 'briefcase';
    return 'location';
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Vendor Dispatch Card */}
        {cart.vendor && (
          <View style={styles.vendorCard}>
            <Ionicons name="storefront" size={18} color={colors.gold.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.vendorCardTitle}>Fulfilled by: {cart.vendor.name}</Text>
              <Text style={styles.vendorCardSub}>Express delivery straight to your door</Text>
            </View>
          </View>
        )}

        {/* 1. Delivery Destination Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={18} color={colors.gold.primary} />
            <Text style={styles.sectionTitle}>Delivery Destination</Text>
          </View>

          {/* Loading indicator for addresses */}
          {isLoadingAddresses && (
            <View style={styles.loadingAddressesBox}>
              <ActivityIndicator size="small" color={colors.gold.primary} />
              <Text style={styles.loadingAddressesText}>Checking saved addresses...</Text>
            </View>
          )}

          {/* List Previously Saved Addresses */}
          {savedAddresses.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={styles.subSectionTitle}>Select a Saved Address</Text>
              <View style={styles.addressList}>
                {savedAddresses.map((item) => {
                  const isSelected = selectedAddressId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.savedAddressCard, isSelected && styles.savedAddressCardSelected]}
                      onPress={() => handleSelectSavedAddress(item)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.savedCardHeader}>
                        <View style={styles.labelBadge}>
                          <Ionicons
                            name={getLabelIcon(item.label)}
                            size={13}
                            color={isSelected ? colors.gold.dark : colors.text.secondary}
                          />
                          <Text
                            style={[
                              styles.labelBadgeText,
                              isSelected && { color: colors.gold.dark, fontWeight: '800' },
                            ]}
                          >
                            {item.label || 'Saved'}
                          </Text>
                        </View>

                        <View style={styles.savedCardActions}>
                          <TouchableOpacity
                            onPress={(e) => handleDeleteSavedAddress(item.id, e)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.deleteAddressBtn}
                          >
                            <Ionicons name="trash-outline" size={15} color={colors.text.muted} />
                          </TouchableOpacity>
                          <Ionicons
                            name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                            size={19}
                            color={isSelected ? colors.gold.primary : colors.text.muted}
                          />
                        </View>
                      </View>

                      <Text style={styles.savedAddressText} numberOfLines={2}>
                        {item.addressLine1}
                      </Text>

                      {item.deliveryInstructions ? (
                        <Text style={styles.savedInstructionsText} numberOfLines={1}>
                          <Ionicons name="information-circle-outline" size={12} color={colors.text.muted} />{' '}
                          {item.deliveryInstructions}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}

                {/* Option to enter a new address */}
                <TouchableOpacity
                  style={[
                    styles.newAddressToggleBtn,
                    selectedAddressId === 'new' && styles.newAddressToggleBtnActive,
                  ]}
                  onPress={handleSelectNewAddress}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={17}
                    color={selectedAddressId === 'new' ? colors.gold.primary : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.newAddressToggleText,
                      selectedAddressId === 'new' && styles.newAddressToggleTextActive,
                    ]}
                  >
                    + Enter a new address
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* New Address Input Form (Shown when entering new or no saved addresses) */}
          {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
            <View style={styles.newAddressForm}>
              {savedAddresses.length > 0 && (
                <View style={styles.formDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>NEW ADDRESS DETAILS</Text>
                  <View style={styles.dividerLine} />
                </View>
              )}

              <Text style={styles.inputLabel}>
                Delivery Address <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Type street address, unit, Sydney NSW"
                placeholderTextColor={colors.text.muted}
                autoFocus={savedAddresses.length === 0}
              />

              {/* Option to Save This Address */}
              <TouchableOpacity
                style={styles.saveAddressCheckRow}
                onPress={() => setSaveAddressOption(!saveAddressOption)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={saveAddressOption ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={saveAddressOption ? colors.gold.primary : colors.text.muted}
                />
                <Text style={styles.saveAddressCheckText}>
                  Save this address for future deliveries
                </Text>
              </TouchableOpacity>

              {/* Address Label Chips (Home, Work, Other) when saving */}
              {saveAddressOption && (
                <View style={styles.labelPickerBox}>
                  <Text style={styles.labelPickerTitle}>Save as:</Text>
                  <View style={styles.labelChipsRow}>
                    {(['Home', 'Work', 'Other'] as AddressLabelType[]).map((lbl) => {
                      const isChipSelected = selectedLabel === lbl;
                      return (
                        <TouchableOpacity
                          key={lbl}
                          style={[styles.labelChip, isChipSelected && styles.labelChipSelected]}
                          onPress={() => setSelectedLabel(lbl)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={getLabelIcon(lbl)}
                            size={14}
                            color={isChipSelected ? colors.dark.darkest : colors.text.secondary}
                          />
                          <Text
                            style={[
                              styles.labelChipText,
                              isChipSelected && styles.labelChipTextSelected,
                            ]}
                          >
                            {lbl}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {selectedLabel === 'Other' && (
                    <TextInput
                      style={[styles.textInput, { marginTop: 8 }]}
                      value={customLabel}
                      onChangeText={setCustomLabel}
                      placeholder="e.g. Partner's House, Beach House"
                      placeholderTextColor={colors.text.muted}
                      maxLength={30}
                    />
                  )}
                </View>
              )}
            </View>
          )}

          {/* Contact Phone */}
          <Text style={styles.inputLabel}>
            Contact Phone (For Delivery SMS) <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="+61 400 000 000"
            placeholderTextColor={colors.text.muted}
            keyboardType="phone-pad"
          />

          {/* Courier Instructions */}
          <Text style={styles.inputLabel}>Courier Instructions (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="e.g. Leave at front door, buzzer 402, ring bell"
            placeholderTextColor={colors.text.muted}
            multiline
          />
        </View>

        {/* 2. 18+ Age Compliance Checkbox */}
        <TouchableOpacity
          style={styles.ageBox}
          onPress={() => setIsAgeConfirmed(!isAgeConfirmed)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isAgeConfirmed ? 'checkbox' : 'square-outline'}
            size={22}
            color={isAgeConfirmed ? colors.gold.dark : colors.text.muted}
          />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.ageTitle}>18+ Age Declaration (Mandatory)</Text>
            <Text style={styles.ageDesc}>
              I confirm I am 18 years or older. A valid Australian photo ID will be inspected by the courier at delivery.
            </Text>
          </View>
        </TouchableOpacity>

        {/* 3. Stripe Payment Gateway Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={18} color={colors.text.primary} />
            <Text style={styles.sectionTitle}>Payment Method (Stripe)</Text>
          </View>

          <View style={styles.stripeBadgeRow}>
            <Text style={styles.stripeBadgeText}>Powered by Stripe 256-Bit SSL</Text>
            <Ionicons name="shield-checkmark" size={14} color={colors.status.success} />
          </View>

          <Text style={styles.inputLabel}>Card Number</Text>
          <View style={styles.cardInputWrap}>
            <Ionicons name="card-outline" size={18} color={colors.text.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.cardInput}
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="4242 •••• •••• 4242"
              placeholderTextColor={colors.text.muted}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.cardRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Expiry</Text>
              <TextInput
                style={styles.textInput}
                value={cardExpiry}
                onChangeText={setCardExpiry}
                placeholder="MM/YY"
                placeholderTextColor={colors.text.muted}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>CVC</Text>
              <TextInput
                style={styles.textInput}
                value={cardCvc}
                onChangeText={setCardCvc}
                placeholder="123"
                placeholderTextColor={colors.text.muted}
                keyboardType="number-pad"
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* 4. Order Total Breakdown Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal ({cart.itemCount} items)</Text>
            <Text style={styles.breakdownVal}>${cart.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Express Delivery</Text>
            <Text style={styles.breakdownVal}>${cart.deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={styles.breakdownTotalLabel}>Total</Text>
            <Text style={styles.breakdownTotalVal}>${cart.total.toFixed(2)}</Text>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      {/* Sticky Bottom Place Order CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.payBtn, isSubmitting ? styles.payBtnDisabled : null]}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.dark.darkest} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={16} color={colors.dark.darkest} />
              <Text style={styles.payBtnText}>Pay & Place Order • ${cart.total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.light,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text.primary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: spacing.md,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.dark.bg,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  vendorCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.gold.primary,
  },
  vendorCardSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  subSectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingAddressesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  loadingAddressesText: {
    fontSize: 12.5,
    color: colors.text.secondary,
  },
  savedSection: {
    marginBottom: spacing.md,
  },
  addressList: {
    gap: 8,
  },
  savedAddressCard: {
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.surface.border,
    padding: spacing.md,
  },
  savedAddressCardSelected: {
    borderColor: colors.gold.primary,
    backgroundColor: '#FCF9EE',
  },
  savedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  savedCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteAddressBtn: {
    padding: 2,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  labelBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  savedAddressText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 18,
  },
  savedInstructionsText: {
    fontSize: 11.5,
    color: colors.text.muted,
    marginTop: 4,
  },
  newAddressToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.surface.border,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  newAddressToggleBtnActive: {
    borderColor: colors.gold.primary,
    backgroundColor: '#FCF9EE',
    borderStyle: 'solid',
  },
  newAddressToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  newAddressToggleTextActive: {
    color: colors.gold.dark,
  },
  newAddressForm: {
    marginBottom: 6,
  },
  formDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surface.border,
  },
  dividerText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 4,
    marginTop: 8,
  },
  requiredStar: {
    color: colors.status.error,
  },
  textInput: {
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.text.primary,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
  },
  textArea: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  saveAddressCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  saveAddressCheckText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  labelPickerBox: {
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.sm,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  labelPickerTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 6,
  },
  labelChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  labelChipSelected: {
    backgroundColor: colors.gold.primary,
    borderColor: colors.gold.primary,
  },
  labelChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  labelChipTextSelected: {
    color: colors.dark.darkest,
  },
  ageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF9C3',
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  ageTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#854D0E',
  },
  ageDesc: {
    fontSize: 11.5,
    color: '#A16207',
    marginTop: 2,
    lineHeight: 16,
  },
  stripeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  stripeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.status.success,
  },
  cardInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: 12,
    height: 44,
  },
  cardInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
  },
  cardRow: {
    flexDirection: 'row',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  breakdownLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    paddingTop: 10,
    marginTop: 4,
  },
  breakdownTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  breakdownTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text.primary,
  },
  errorText: {
    color: colors.status.badgeDanger,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  payBtn: {
    backgroundColor: colors.gold.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  payBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.dark.darkest,
  },
});
