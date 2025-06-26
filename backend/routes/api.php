<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ScoreboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\PreguntaController;

Route::get('/index', [ScoreboardController::class, 'index']);
Route::post('/save', [ScoreboardController::class, 'store']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [RegisterController::class, 'register']);

// Pregunta API sin autenticación Sanctum, usando user_id por parámetro o body
Route::get('/preguntas', [PreguntaController::class, 'index']);
Route::post('/preguntas', [PreguntaController::class, 'store']);
Route::put('/preguntas/{id}', [PreguntaController::class, 'update']);
Route::delete('/preguntas/{id}', [PreguntaController::class, 'destroy']);
