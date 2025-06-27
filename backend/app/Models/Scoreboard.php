<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use PHPUnit\TextUI\XmlConfiguration\UpdateSchemaLocation;

class Scoreboard extends Model
{
       /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;
    protected $fillable = [
        'user_id',
        'score',
    ];
    protected $table = 'scoreboard';
    public $timestamps = false;

    /**
     * Un puntaje pertenece a un usuario
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
