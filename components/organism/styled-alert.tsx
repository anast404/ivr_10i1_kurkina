import { Modal, ModalProps, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type TStyledAlert = ModalProps & {
  title?: string,
  message?: string,
  label?: string,
  onClose: () => void,
}

export function StyledAlert({ visible, title, message, onClose, label = 'OK', ...otherProps }: TStyledAlert) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      {...otherProps}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {title && <Text style={styles.modalTitle}>{title}</Text>}
          {message && <Text style={styles.modalMessage}>{message}</Text>}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.textStyle}>{label}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalMessage: {
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 5,
    padding: 10,
    elevation: 2,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
