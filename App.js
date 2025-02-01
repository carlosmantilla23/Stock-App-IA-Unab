import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  ScrollView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

const SERVER_URL = "http://44.204.10.241:8080/detect/";

export default function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detections, setDetections] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setDetections([]);
    }
  };

  const takePhoto = async () => {
    let permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Se requiere acceso a la cámara para tomar fotos.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setDetections([]);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      Alert.alert("Selecciona o toma una foto primero.");
      return;
    }

    setLoading(true);
    let formData = new FormData();
    formData.append("file", {
      uri: image,
      name: "shelf.jpg",
      type: "image/jpeg",
    });

    try {
      let response = await fetch(SERVER_URL, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      let result = await response.json();
      setDetections(result.objetos_detectados);
    } catch (error) {
      Alert.alert("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#00416A", "#E4E5E6"]} style={styles.container}>
      <Text style={styles.title}>📸 Análisis de Stock</Text>

      {image && (
        <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
      )}

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>📂 Seleccionar Imagen</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <Text style={styles.buttonText}>📷 Tomar Foto</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={uploadImage}
        disabled={loading}
      >
        <Text style={styles.buttonText}>🚀 Enviar Imagen</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#fff" style={styles.loader} />}

      {detections.length > 0 && (
        <>
          <Text style={styles.resultText}>📊 Total de objetos detectados: {detections.length}</Text>

          <TouchableOpacity style={styles.analysisButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.buttonText}>📊 Ver Análisis</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Modal para ver detalles de la detección */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 Análisis Detallado</Text>
            <ScrollView style={styles.scrollView}>
              {detections.map((item, index) => (
                <Text key={index} style={styles.detectionItem}>
                  🔹 {item.producto} - Confianza: {item.confianza}
                </Text>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>❌ Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pie de página con la información */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Universidad Autónoma de Bucaramanga</Text>
        <Text style={styles.footerText}>Inteligencia Artificial</Text>
        <Text style={styles.footerText}>Carlos Mantilla Jaimes</Text>
        <Text style={styles.footerText}></Text>
      </View>
    </LinearGradient>
  );
}

// Estilos mejorados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  image: {
    width: "90%",
    height: 250,
    borderRadius: 15,
    marginBottom: 15,
    backgroundColor: "#ddd",
    borderWidth: 2,
    borderColor: "#fff",
  },
  button: {
    backgroundColor: "#FFA500",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
    width: "90%",
  },
  analysisButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    width: "90%",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
  loader: {
    marginTop: 20,
  },
  resultText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  scrollView: {
    width: "100%",
    maxHeight: 200,
  },
  detectionItem: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: "#D32F2F",
    padding: 10,
    borderRadius: 10,
    marginTop: 15,
    width: "90%",
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    bottom: 10,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
    
  },
});

