# P-Web: Juego Web (Angular + Laravel)

## Descripción

P-Web es un juego web desarrollado con Angular (frontend) y Laravel (backend). El juego permite a los usuarios registrarse, iniciar sesión y competir en un tablero de puntuaciones. Incluye panel de administración y funcionalidades de autenticación.

---

## Instalación Sencilla (Automática)

### 1. Clona el repositorio
```bash
git clone <url-del-repo>
cd P-Web
```

### 2. Instala dependencias del backend y frontend
```bash
cd backend
composer install
npm install
cd ../Front
npm install
```

### 3. Configura el entorno de Laravel
```bash
cd ../backend
php artisan key:generate
php artisan migrate
```
### En caso de no tener la base de datos 
### Saldra el siguiente mensaje
```bash
   WARN  The database 'backend' does not exist on the 'mysql' connection.

  Would you like to create it? (yes/no) [yes]
```
Escribir "y" y pulsar enter

#### -Warning- En caso de no salir el mensaje crear desde su gestor
#### la base de datos con el siguiente nombre: backend

### Para llenar la base de datos
- desde P-Web/backend
```bash
php artisan db:seed
```

### 4. Ejecuta ambos servidores (desarrollo)
- **Desde la raíz del proyecto:**
Es decir desde /P-Web/
```bash
cd backend
php artisan serve
cd ../Front
ng serve
```
Esto levantará el backend de Laravel y el frontend de Angular en modo desarrollo (usando Vite y Angular CLI).
## Por ultimo
### Para empezar a jugar dirigirse a:
    Abre tu navegador en [http://localhost:4200](http://localhost:4200) y ¡a jugar!

---

## Instalación Manual (Avanzada)

### 1. Instala dependencias del backend
- Abre `backend/composer.json` y asegúrate de tener
las siguiente dependencias:
```json
    "require": {
        "php": "^8.2",
        "laravel/framework": "^12.0",
        "laravel/tinker": "^2.10.1"
    },
    "require-dev": {
        "fakerphp/faker": "^1.23",
        "laravel/pail": "^1.2.2",
        "laravel/pint": "^1.13",
        "laravel/sail": "^1.41",
        "mockery/mockery": "^1.6",
        "nunomaduro/collision": "^8.6",
        "pestphp/pest": "^3.8",
        "pestphp/pest-plugin-laravel": "^3.2"
    },
```
- Ejecuta:
```bash
composer install
```

### 2. Instala dependencias del frontend
- Abre `Front/package.json` y revisa las dependencias de Angular:
```json
  "dependencies": {
    "@angular/animations": "^16.2.0",
    "@angular/common": "^16.2.0",
    "@angular/compiler": "^16.2.0",
    "@angular/core": "^16.2.0",
    "@angular/forms": "^16.2.0",
    "@angular/platform-browser": "^16.2.0",
    "@angular/platform-browser-dynamic": "^16.2.0",
    "@angular/router": "^16.2.0",
    "rxjs": "^7.8.2",
    "tslib": "^2.6.2",
    "zone.js": "^0.13.3"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^16.2.12",
    "@angular/cli": "^16.2.12",
    "@angular/compiler-cli": "^16.2.0",
    "@types/jasmine": "~4.3.0",
    "@types/uuid": "^10.0.0",
    "jasmine-core": "~4.6.0",
    "karma": "~6.4.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.0.4"
  }
```
- Ejecuta:
```bash
cd ../Front
npm install
```

### 3. Configura variables de entorno y base de datos
- Modifica el `.env` en `backend` y configura tu base de datos.
- Ejecuta migraciones:
```bash
php artisan migrate
//Si quieres llenar la base
php artisan db:seed
```

### 4. Compila y ejecuta manualmente
- Backend:
```bash
php artisan serve
```
- Frontend:
```bash
cd ../Front
ng serve
```

---

## Ejecución y Detalles del Juego

- **Backend (Laravel):** Corre en `http://localhost:8000` (por defecto).
- **Frontend (Angular):** Corre en `http://localhost:4200`.
- El frontend consume la API del backend para autenticación, registro y puntuaciones.
- Incluye panel de administración y tablero de puntuaciones.
- Puedes modificar las rutas y puertos en los archivos de configuración si lo necesitas.

---

¡Listo! Así puedes instalar y ejecutar el proyecto tanto de forma sencilla como manual. Para dudas, contacta al autor/Mapuches.

# Descripcion del juego

# 🚗💻 Sopa de Letras: ¡El Juego de Programadores!

¡Bienvenido a **Sopa de Letras**! Un juego web hecho con Angular donde tu misión es encontrar palabras de programación moviendo un auto 🚗 por el tablero. ¿Listo para poner a prueba tu lógica y tus conocimientos tech?

---

## 🎮 ¿Cómo jugar?

1. Ingresa al menú principal y haz clic en **Jugar**.
2. Elige la dificultad: Fácil, Medio o Difícil.
3. Usa las flechas para mover el auto y encuentra las palabras ocultas en el tablero.
4. ¡Desbloquea todas las palabras y compite por el mejor puntaje!

---

## 🛠️ Tecnologías
- **Angular 16**
- Angular
- Laravel
- SCSS
- MySQL

---

## 🚀 Comenzar

```bash
ng serve
```
Abre tu navegador en [http://localhost:4200](http://localhost:4200) y ¡a jugar!

---

## 🏆 Puntaje
Consulta tu puntaje y mejora tus tiempos en la sección **Puntaje** del menú.

---
