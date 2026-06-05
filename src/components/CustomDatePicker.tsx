import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CustomDatePickerProps {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  title?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  visible,
  value,
  onChange,
  onClose,
  title = 'Select Date',
}) => {
  const [tempDate, setTempDate] = useState<Date>(value);

  // Sync tempDate with the value prop when modal is opened
  useEffect(() => {
    if (visible) {
      setTempDate(value);
    }
  }, [visible, value]);

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={value}
        mode="date"
        display="default"
        onChange={(event, date) => {
          onClose();
          if (event.type === 'set' && date) {
            onChange(date);
          }
        }}
      />
    );
  }

  // iOS Custom Bottom Sheet Modal
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.pickerContainer}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.titleText}>{title}</Text>
            <TouchableOpacity
              onPress={() => {
                onChange(tempDate);
                onClose();
              }}
              style={styles.headerBtn}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerWrapper}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              textColor="#000"
              onChange={(event, date) => {
                if (date) {
                  setTempDate(date);
                }
              }}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  doneText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '700',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  pickerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
});
