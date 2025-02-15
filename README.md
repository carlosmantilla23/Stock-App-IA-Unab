# Ejercicio Full Stack - IA Unab

Autor: Carlos Mantilla Jaimes

## Objetivo
El objetivo principal de este proyecto es desarrollar una solución FullStack basada en Inteligencia Artificial que permita a los usuarios analizar imágenes para detectar objetos en entornos de interés, como estanterías de supermercados.

Este sistema utiliza YOLOv8, un modelo avanzado de detección de objetos, integrado con FastAPI en el backend y una aplicación móvil en React Native con Expo en el frontend. La solución permite a los usuarios capturar o seleccionar imágenes y obtener un análisis detallado de los objetos detectados.

![alt text](https://github.com/carlosmantilla23/Stock-App-IA-Unab/blob/main/Stock-App-IA-Unab.png)

# 📌 Estructura del Proyecto
## El proyecto tiene tres partes:

## 1️⃣ Infraestructura (AWS EC2): Ejecuta el backend con acceso desde la app móvil:

Se lanza instancia Ubuntu:

![image](https://github.com/user-attachments/assets/d3ddff97-d9b7-4fca-a8a1-11748ada0bcb)

![image](https://github.com/user-attachments/assets/fdf77fb3-8653-4a4a-8b91-362953414c49)

Aseguramos habilitar los puertos en Seguridad / Reglas de Entrada:

![image](https://github.com/user-attachments/assets/7507bfce-a79d-4206-bb11-c6c57d2e4b7f)

Se establece conexión a instancia e instala Python y Pip

 ```bash
sudo apt install python3-pip python3-venv
 ```

Se habilita el entorno virtual
 ```bash
python3 -m venv env
source env/bin/activate
 ```

Instalamos librerías
 ```bash
pip install fastapi uvicorn ultralytics python-multipart opencv-python pillow
 ```

##### FastAPI: Framework de Python para construir APIs rápidas y eficientes.
##### Uvicorn: Servidor ASGI para ejecutar aplicaciones FastAPI.
##### Ultralytics (YOLOv8): Implementación de YOLOv8 para detección de objetos en imágenes.
##### Python-Multipart: Maneja archivos enviados en formularios multipart/form-data.
##### OpenCV-Python: Biblioteca para procesamiento y manipulación de imágenes.
##### Pillow: Librería para abrir, manipular y guardar imágenes en varios formatos.


## 2️⃣ Backend (FastAPI en Python): Servirá el modelo YOLOv8 y procesará imágenes.

#### Se crea el archivo: app.py:

![image](https://github.com/user-attachments/assets/62827187-0843-4798-8ffe-32b2bf2a96ba)


```python
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from ultralytics import YOLO
import cv2
import numpy as np
import shutil

app = FastAPI()
model = YOLO("yolov8n.pt")  # Cargar YOLOv8

#Endpoint
@app.post("/detect/")
async def detect_objects(file: UploadFile = File(...)):
    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    #Leer la imagen utilizando OpenCV
    image = cv2.imread(file_path)
    results = model(image)

    detections = []
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            label = model.names[cls]

            detections.append({
                "producto": label,
                "confianza": round(conf, 2),
                "coordenadas": [int(x1), int(y1), int(x2), int(y2)]
            })

    return JSONResponse(content={"objetos_detectados": detections})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)

```


###  3️⃣Frontend (React Native con Expo): Permitirá tomar/seleccionar imágenes y enviarlas al servidor.












Se crea el directorio del proyecto:

![image](https://github.com/user-attachments/assets/98e77694-d3c0-4c74-b723-b5f3b7705717)

Nos ubicamos en el directorio creado:

![image](https://github.com/user-attachments/assets/0c5f44a5-32ad-4e73-9743-4b9748ff2ea1)

Instalamos las librerías necesarias para el proyecto:

![image](https://github.com/user-attachments/assets/e0474566-9514-40c9-9871-55e60a76f99f)
![image](https://github.com/user-attachments/assets/e267c96c-382e-41b9-afba-00f0c6e42e32)

Abrimos el proyecto en VS Code:

![image](https://github.com/user-attachments/assets/41d218b9-96c1-489b-afb7-2406783b0d2c)

Modificamos nuestro archivo App.js con el siguiente código:

```python

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

const SERVER_URL = "http://18.212.24.91:8080/detect/";

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

```

##### Se debe tener en cuenta que la IP del EC2 varía con lo cual se deberá cambiar antes de lanzar expo


```python
const SERVER_URL = "http://18.212.24.91:8080/detect/";
```


Iniciamos Expo

![image](https://github.com/user-attachments/assets/601cb6a3-f6ca-416c-8d44-28d9209f1cee)



















