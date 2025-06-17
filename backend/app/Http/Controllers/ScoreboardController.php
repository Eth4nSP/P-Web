<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Scoreboard;
use App\Models\User;

class ScoreboardController extends Controller
{
    // Obtener todas las puntuaciones (opcional: paginadas)
    public function index()
    {
        $scores = Scoreboard::with('user')
            ->orderByDesc('score')
            ->get()
            ->values(); // Ensure zero-based index

        $scores = $scores->map(function ($score, $index) {
            return [
                'id' => $score->id,
                'user_name' => $score->user ? $score->user->name : null,
                'score' => $score->score,
                'posicion' => $index + 1, // Add absolute position
            ];
        });
        return response()->json($scores);
    }

    // Guardar una nueva puntuación
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'score' => 'required|integer',
        ]);
        $score = Scoreboard::create($validated);
        return response()->json($score, 201);
    }
}
