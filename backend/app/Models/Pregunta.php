<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pregunta extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pregunta',
        'dificultad',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
