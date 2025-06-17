<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ScoreboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RegisterController;

Route::get('/index', [ScoreboardController::class, 'index']);
Route::post('/save', [ScoreboardController::class, 'store']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [RegisterController::class, 'register']);
