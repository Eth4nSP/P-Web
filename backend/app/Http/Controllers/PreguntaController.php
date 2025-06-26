<?php

namespace App\Http\Controllers;

use App\Models\Pregunta;
use Illuminate\Http\Request;

class PreguntaController extends Controller
{
    // Listar preguntas por user_id (query param)
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        if (!$userId) {
            return response()->json(['error' => 'user_id requerido'], 400);
        }
        $preguntas = Pregunta::where('user_id', $userId)->get();
        return response()->json($preguntas);
    }

    // Guardar nueva pregunta
    public function store(Request $request)
    {
        $request->validate([
            'pregunta' => 'required|string',
            'dificultad' => 'required|in:facil,medio,dificil',
            'user_id' => 'required|integer',
        ]);
        $pregunta = Pregunta::create([
            'user_id' => $request->user_id,
            'pregunta' => $request->pregunta,
            'dificultad' => $request->dificultad,
        ]);
        return response()->json($pregunta, 201);
    }

    // Actualizar pregunta
    public function update(Request $request, $id)
    {
        $request->validate([
            'pregunta' => 'required|string',
            'dificultad' => 'required|in:facil,medio,dificil',
            'user_id' => 'required|integer',
        ]);
        $pregunta = Pregunta::where('user_id', $request->user_id)->findOrFail($id);
        $pregunta->update($request->only(['pregunta', 'dificultad']));
        return response()->json($pregunta);
    }

    // Eliminar pregunta
    public function destroy(Request $request, $id)
    {
        $userId = $request->query('user_id');
        if (!$userId) {
            return response()->json(['error' => 'user_id requerido'], 400);
        }
        $pregunta = Pregunta::where('user_id', $userId)->findOrFail($id);
        $pregunta->delete();
        return response()->json(['message' => 'Pregunta eliminada']);
    }
}
