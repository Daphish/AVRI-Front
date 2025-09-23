<div align="center">
  <a href="#">
    <picture>
      <source srcset="public/Logo-AVRI-Alt.png" media="(prefers-color-scheme: dark)">
      <source srcset="public/Logo-AVRI.png" media="(prefers-color-scheme: light)">
      <img src="public/Logo-AVRI.png" width="520" alt="AVRI logo">
    </picture>
  </a>
</div>

# AVRI-Front 

Interfaces for the **Virtual Assistant of the Institutional Repository**

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Setup](#project-setup)
- [Running the Application](#running-the-application)
- [Verification](#verification)
- [Stop the Server](#stop-the-server)
- [Technologies](#technologies)

---

## Prerequisites

Before starting, make sure you have installed:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.com/) (included with Node.js)
- [Angular CLI](https://angular.io/cli) (optional, but recommended)

```bash
# Check installed versions
node --version
npm --version
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Daphish/AVRI-Front.git
```

### 2. Navigate to the project directory

```bash
cd AVRI-Front
```

---

## ⚙️ Project Setup

### Install dependencies

As this is an Angular project, it's necessary to install all dependencies:

```bash
npm install
```

> **📝 Note**: This process may take a few minutes depending on your internet connection.

---

## 🏃‍♂️ Running the Application

### Start the development server

```bash
npm start
```

The server will automatically start on port `4200`.

---

## Verification

### 1. Terminal verification

If everything runs correctly, you should see output similar to this in your terminal:

![Terminal Success](https://github.com/user-attachments/assets/beed2f05-ab65-42a2-a993-467e5d062bdf)

### 2. Browser verification

Open your web browser and navigate to:

```
http://localhost:4200/home
```

You should see the login screen:

![Login Screen](https://github.com/user-attachments/assets/7d100cb6-98f0-4aab-8e16-f700321774f1)

### 3. Available routes

- **Home**: `http://localhost:4200/home`
- **Main**: `http://localhost:4200/`

---

### Testing

Currently, there are some tests in development that mainly cover (but are not limited to):

- Authentication Services
- Chat Services
- Document Services
- Basic creation tests (Various components)

If you want to verify the tests, you should use the following command in the project's root directory:

```bash
npx ng test --watch=false --browser=ChromeHeadless --code-coverage
```

---

## Stop the Server

To stop the development server:

1. Go to the terminal where the server is running
2. Press `Ctrl + C`
3. Confirm the action if prompted

```bash
# The server will stop and you'll see something similar to:
^C
Terminated
```

---

## Technologies

This project is built with:

- **[Angular](https://angular.io/)** - Main framework
- **[TypeScript](https://www.typescriptlang.org/)** - Programming language
- **[Node.js](https://nodejs.org/)** - Runtime environment
- **[npm](https://www.npmjs.com/)** - Package manager

### Dependency Versions
```json
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
```

---

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Code linting
npm run lint
```

---

## Troubleshooting

### Error: "ng is not recognized as a command"

If you encounter this error, install Angular CLI globally:

```bash
npm install -g @angular/cli
```

### Error: "Port 4200 is already in use"

If the port is occupied, you can use a different port:

```bash
ng serve --port 4201
```

### Dependencies issues

If you have problems with dependencies, try:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

---

## Contributing

If you find any issues or have improvement suggestions:

1. Open an [issue](https://github.com/Daphish/AVRI-Front/issues)
2. Create a pull request with your changes
3. Follow the project's code conventions

---

## Related Links

- [AVRI-Back](https://github.com/MikelBarajas38/AVRI-Back) - Project API
- [Angular Documentation](https://angular.io/docs)
- [Node.js Documentation](https://nodejs.org/docs/)
