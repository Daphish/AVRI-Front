<div align="center">
  <a href="#">
    <picture>
      <source srcset="public/Logo-AVRI-Alt.png" media="(prefers-color-scheme: dark)">
      <source srcset="public/Logo-AVRI.png" media="(prefers-color-scheme: light)">
      <img src="public/Logo-AVRI.png" width="520" alt="AVRI logo">
    </picture>
  </a>
</div>

# AVRI-Front 🖥️

Interfaces para el **Asistente Virtual del Repositorio Institucional**

---

## 📋 Tabla de Contenidos

- [Pre-requisitos](#pre-requisitos)
- [Instalación](#instalación)
- [Configuración del Proyecto](#configuración-del-proyecto)
- [Ejecución](#ejecución)
- [Verificación](#verificación)
- [Detener el Servidor](#detener-el-servidor)
- [Tecnologías](#tecnologías)

---

## 🔧 Pre-requisitos

Antes de comenzar, asegúrate de tener instalado:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (versión 16 o superior)
- [npm](https://www.npmjs.com/) (incluido con Node.js)
- [Angular CLI](https://angular.io/cli) (opcional, pero recomendado)

```bash
# Verificar versiones instaladas
node --version
npm --version
```

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Daphish/AVRI-Front.git
```

### 2. Navegar al directorio del proyecto

```bash
cd AVRI-Front
```

---

## ⚙️ Configuración del Proyecto

### Instalar dependencias

Como este es un proyecto Angular, es necesario instalar todas las dependencias:

```bash
npm install
```

> **📝 Nota**: Este proceso puede tomar algunos minutos dependiendo de tu conexión a internet.

---

## 🏃‍♂️ Ejecución

### Iniciar el servidor de desarrollo

```bash
npm start
```

El servidor se iniciará automáticamente en el puerto `4200`.

---

## ✅ Verificación

### 1. Verificación en terminal

Si todo se ejecutó correctamente, deberías ver una salida similar a esta en tu terminal:

![Terminal Success](https://github.com/user-attachments/assets/beed2f05-ab65-42a2-a993-467e5d062bdf)

### 2. Verificación en el navegador

Abre tu navegador web y navega a:

```
http://localhost:4200/home
```

Deberías ver la pantalla de inicio de sesión:

![Login Screen](https://github.com/user-attachments/assets/7d100cb6-98f0-4aab-8e16-f700321774f1)

### 3. Rutas disponibles

- **Home**: `http://localhost:4200/home`
- **Principal**: `http://localhost:4200/`

---

## 🛑 Detener el Servidor

Para detener el servidor de desarrollo:

1. Ve a la terminal donde está ejecutándose el servidor
2. Presiona `Ctrl + C`
3. Confirma la acción si se te solicita

```bash
# El servidor se detendrá y verás algo similar a:
^C
Terminated
```

---

## 🛠️ Tecnologías

Este proyecto está construido con:

- **[Angular](https://angular.io/)** - Framework principal
- **[TypeScript](https://www.typescriptlang.org/)** - Lenguaje de programación
- **[Node.js](https://nodejs.org/)** - Entorno de ejecución
- **[npm](https://www.npmjs.com/)** - Gestor de paquetes

### 📦 Versiones de Dependencias
```json
avri@0.0.0
├── @angular-devkit/build-angular@18.2.14
├── @angular/animations@18.2.13
├── @angular/cli@18.2.14
├── @angular/common@18.2.13
├── @angular/compiler-cli@18.2.13
├── @angular/compiler@18.2.13
├── @angular/core@18.2.13
├── @angular/forms@18.2.13
├── @angular/platform-browser-dynamic@18.2.13
├── @angular/platform-browser@18.2.13
├── @angular/platform-server@18.2.13
├── @angular/router@18.2.13
├── @angular/ssr@18.2.14
├── @types/express@4.17.21
├── @types/jasmine@5.1.5
├── @types/node@18.19.74
├── body-parser@1.20.3
├── bootstrap-icons@1.11.3
├── cors@2.8.5
├── express@4.21.2
├── jasmine-core@5.2.0
├── karma-chrome-launcher@3.2.0
├── karma-coverage@2.2.1
├── karma-jasmine-html-reporter@2.1.0
├── karma-jasmine@5.1.0
├── karma@6.4.4
├── router@2.2.0
├── rxjs@7.8.1
├── tslib@2.8.1
├── typescript@5.5.4
└── zone.js@0.14.10
---

## 📝 Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Construir para producción
npm run build

# Ejecutar tests
npm test

# Linting del código
npm run lint
```

---

## 🔧 Solución de Problemas

### Error: "ng no es reconocido como comando"

Si encuentras este error, instala Angular CLI globalmente:

```bash
npm install -g @angular/cli
```

### Error: "Puerto 4200 ya está en uso"

Si el puerto está ocupado, puedes usar un puerto diferente:

```bash
ng serve --port 4201
```

### Problemas con dependencias

Si tienes problemas con las dependencias, intenta:

```bash
# Limpiar caché de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules
npm install
```

---

## 🤝 Contribución

Si encuentras algún problema o tienes sugerencias de mejora:

1. Abre un [issue](https://github.com/Daphish/AVRI-Front/issues)
2. Crea un pull request con tus cambios
3. Sigue las convenciones de código del proyecto

---


## 🔗 Enlaces Relacionados

- [AVRI-Back](https://github.com/MikelBarajas38/AVRI-Back) - API del proyecto
- [Angular Documentation](https://angular.io/docs)
- [Node.js Documentation](https://nodejs.org/docs/)
