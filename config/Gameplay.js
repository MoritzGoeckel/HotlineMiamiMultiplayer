module.exports = {
    movementSpeed:0.5, 
    minMouseDistanceMoveForward:35,
    playerCollisionRadius:100,
    bloodDespawnTimeout:5000,
    projectileDespawnTimeout:5000,
    backColor: 0xFFFFFF,
    guns: {
        assult:{
            sound_fire:"", sound_reload:"", reload_time:1000, clip_size:12, fire_rate:100, projectile_speed:2.5, projectile_demage:1, projectile_texture:"", fire_method:"normal"
        },
        mp:{
            sound_fire:"", sound_reload:"", reload_time:1000, clip_size:12, fire_rate:100, projectile_speed:2.5, projectile_demage:1, projectile_texture:"", fire_method:"normal"
        },
        shotgun:{
            sound_fire:"", sound_reload:"", reload_time:1000, clip_size:12, fire_rate:100, projectile_speed:2.5, projectile_demage:1, projectile_texture:"", fire_method:"spread"
        },
        pistol:{
            sound_fire:"", sound_reload:"", reload_time:1000, clip_size:12, fire_rate:100, projectile_speed:2.5, projectile_demage:1, projectile_texture:"", fire_method:"normal"
        }
    }
};