<?php

use App\Http\Controllers\ScoreboardController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/index', [ScoreboardController::class, 'index']);
