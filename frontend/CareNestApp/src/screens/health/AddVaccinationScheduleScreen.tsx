import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '../../theme/colors';

export default function AddVaccinationScheduleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Form States
  const [vaccineName, setVaccineName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [date, setDate] = useState(new Date());
  const [lotNumber, setLotNumber] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const handleSave = () => {
    if (!vaccineName) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên vắc xin');
      return;
    }
    // Simulate saving
    Alert.alert('Thành công', 'Hồ sơ tiêm chủng đã được lưu', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top }]}
    >
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0369a1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ghi nhận tiêm chủng</Text>
        <TouchableOpacity style={styles.helpBtn}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color="#0369a1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.introText}>
          Ghi lại lịch sử tiêm chủng của con bạn để duy trì hồ sơ sức khỏe đầy đủ.
        </Text>

        {/* Section 1: Vaccine Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vaccine Details</Text>
          
          <Text style={styles.inputLabel}>TÊN VẮC XIN</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="needle" size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Vắc xin 6 trong 1"
              placeholderTextColor="#94a3b8"
              value={vaccineName}
              onChangeText={setVaccineName}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>CÔNG DỤNG / PHÒNG BỆNH</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="shield-outline" size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Vắc xin này phòng bệnh gì?"
              placeholderTextColor="#94a3b8"
              value={purpose}
              onChangeText={setPurpose}
            />
          </View>
        </View>

        {/* Section 2: Thông tin vắc xin */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin vắc xin</Text>
          
          <Text style={styles.inputLabel}>NGÀY TIÊM</Text>
          <TouchableOpacity 
            style={styles.inputWrap} 
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#64748b" />
            <Text style={[styles.input, !date ? { color: '#94a3b8' } : { color: '#1e293b' }]}>
              {formatDate(date)}
            </Text>
            <MaterialCommunityIcons name="calendar" size={20} color="#64748b" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>SỐ LÔ (TÙY CHỌN)</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="pound" size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Số lô"
              placeholderTextColor="#94a3b8"
              value={lotNumber}
              onChangeText={setLotNumber}
            />
          </View>

          <Text style={[styles.inputLabel, { marginTop: 20 }]}>ĐỊA ĐIỂM / PHÒNG KHÁM</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="plus-box-outline" size={20} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Phòng khám Nhi thành phố"
              placeholderTextColor="#94a3b8"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* Section 3: Thông tin thực hiện */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin thực hiện</Text>
          <View style={[styles.inputWrap, styles.notesInputWrap]}>
            <MaterialCommunityIcons 
              name="file-document-edit-outline" 
              size={20} 
              color="#64748b" 
              style={{ marginTop: 2 }} 
            />
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Các phản ứng sau tiêm, sốt, hoặc lời khuyên của bác sĩ..."
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={styles.submitBtn} 
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={24} color="#fff" />
          <Text style={styles.submitBtnText}>Lưu hồ sơ tiêm chủng</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f7ff' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  helpBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0369a1' },
  
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  introText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 10,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 24 },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 10,
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 60,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },

  notesInputWrap: { height: 120, alignItems: 'flex-start', paddingVertical: 16 },
  notesInput: { marginLeft: 12, height: '100%' },

  footer: { paddingHorizontal: 24, paddingVertical: 10 },
  submitBtn: {
    height: 64,
    backgroundColor: '#3498db',
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
