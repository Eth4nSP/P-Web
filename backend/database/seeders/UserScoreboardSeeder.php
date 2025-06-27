<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Scoreboard;

class UserScoreboardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear 5 usuarios, cada uno con 2 puntajes
        User::factory(5)->create()->each(function ($user) {
            Scoreboard::factory()->create([
                'user_id' => $user->id,
                'score' => fake()->numberBetween(100, 500),
            ]);
            Scoreboard::factory()->create([
                'user_id' => $user->id,
                'score' => fake()->numberBetween(501, 1000),
            ]);
        });
    }
}
