# Ejercicio Full Stack - IA Unab


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



