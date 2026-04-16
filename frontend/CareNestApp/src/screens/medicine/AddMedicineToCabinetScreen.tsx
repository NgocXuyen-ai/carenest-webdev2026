import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { TOP_BAR_HEIGHT, BOTTOM_NAV_HEIGHT } from '../../utils/constants';
import Icon from '../../components/common/Icon';
import TopAppBar from '../../components/layout/TopAppBar';
import Input from '../../components/common/Input';

export default function AddMedicineToCabinetScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('viên');
  const [expiryDate, setExpiryDate] = useState('');
  const [note, setNote] = useState('');

  const UNITS = ['viên', 'gói', 'chai', 'tuýp', 'hộp'];
  const canSubmit = name.trim().length > 0 && expiryDate.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <TopAppBar variant="detail" title="Thêm thuốc vào tủ" />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: TOP_BAR_HEIGHT + insets.top + 16, paddingBottom: BOTTOM_NAV_HEIGHT + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* OCR shortcut */}
          <TouchableOpacity style={styles.ocrBanner} activeOpacity={0.85}>
            <View style={styles.ocrIcon}>
              <Icon name="document_scanner" size={22} color={colors.primary} />
            </View>
            <View style={styles.ocrInfo}>
              <Text style={styles.ocrTitle}>Quét toa thuốc tự động</Text>
              <Text style={styles.ocrSub}>Dùng camera để nhận diện và điền thông tin</Text>
            </View>
            <Icon name="chevron_right" size={18} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>hoặc nhập tay</Text>
            <View style={styles.divider} />
          </View>

          {/* Form */}
          <View style={[styles.card, shadows.sm]}>
            <Input
              label="Tên thuốc *"
              value={name}
              onChangeText={setName}
              placeholder="VD: Panadol Extra"
              leftIcon={<Icon name="pill" size={18} color={colors.outline} />}
            />
            <Input
              label="Số lượng"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              keyboardType="numeric"
              leftIcon={<Icon name="format_list_numbered" size={18} color={colors.outline} />}
            />
            {/* Unit selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Đơn vị</Text>
              <View style={styles.unitRow}>
                {UNITS.map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, unit === u && styles.unitChipActive]}
                    onPress={() => setUnit(u)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Input
              label="Hạn sử dụng *"
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="YYYY-MM-DD"
              leftIcon={<Icon name="calendar_today" size={18} color={colors.outline} />}
            />
            <Input
              label="Ghi chú"
              value={note}
              onChangeText={setNote}
              placeholder="Ghi chú thêm..."
              leftIcon={<Icon name="edit_note" size={18} color={colors.outline} />}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            disabled={!canSubmit}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Icon name="add" size={20} color={colors.onPrimary} />
            <Text style={styles.submitBtnText}>Thêm vào tủ thuốc</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: 16, gap: 16 },
  ocrBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.primaryFixed, borderRadius: 16, padding: 14,
  },
  ocrIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  ocrInfo: { flex: 1 },
  ocrTitle: { fontSize: 14, fontFamily: 'Manrope', fontWeight: '700', color: colors.primary },
  ocrSub: { fontSize: 12, fontFamily: 'Inter', color: colors.primary + 'BB', marginTop: 2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant },
  dividerText: { fontSize: 12, fontFamily: 'Inter', color: colors.onSurfaceVariant },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 12 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurfaceVariant },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unitChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.surfaceContainerHigh, borderRadius: 8,
  },
  unitChipActive: { backgroundColor: colors.primary },
  unitText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600', color: colors.onSurface },
  unitTextActive: { color: colors.onPrimary },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, backgroundColor: colors.primary, borderRadius: 999, gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontFamily: 'Inter', fontWeight: '700', color: colors.onPrimary },
});
