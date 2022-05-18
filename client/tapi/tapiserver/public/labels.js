let labelNames = ['ID','Name','RenderType','LineOfSight','Ballistic','Dropped','Turret','Vlaunch','Model','Range','ReloadTime','EnergyPerShot','MetalPerShot','WeaponTimer','WeaponVelocity','StartVelocity','WeaponAcceleration','TurnRate','AreaOfEffect','EdgeEffectiveness','Burst','BurstRate','SprayAngle','RandomDecay','BeamWeapon','Duration','Color','Color2','SoundStart','SoundHit','SoundTrigger','SoundWater','Accuracy','FireStarter','SmokeTrail','SmokeDelay','StartSmoke','EndSmoke','Guidance','Tracks','SelfProp','TwoPhase','FlightTime','NoAutoRange','Cruise','Propeller','WaterWeapon','BurnBlow','Tolerance','PitchTolerance','Paralyzer','MinBarrelAngle','HoldTime','Stockpile','Interceptor','Coverage','Targetable','CommandFire','ShakeMagnitude','ShakeDuration','NoRadar','GroundBounce','UnitsOnly','NoExplode','ToAirWeapon','ExplosionGAF','ExplosionArt','Damage Section','AimRate','WeaponType2'].map(label => label.toLowerCase());

let labelTexts = [`This specifies a unique value from 0 to 255. Weapons with the same ID will conflict and only one of them will work. I'm sure everyone knows this. Also, IDs 253 to 255 seem to be reserved for the engine to destroy trees and stuff, so don't use those.`,

`
Just the name of the weapon for clarification purposes. Doesn't affect anything in-game. The units reference the name at the top in the square brackets. Might show up somewhere on an info screen, and I'm sure UnitUniverse displays it.`,

`
How the weapon is displayed.
0: Lasers, which are drawn from a single point that represents the actual projectile, and continue to be drawn according to the Duration tag.
1: 3D model like a missile, rotated 180 degrees on the Z-axis (upside down but facing the same way). The whole model is displayed as soon as it is fired.
2: Mindgun. A tiny square that looks like it magnifies the ground below it like a little floating lens.
3: 3D model like a missile, rotated 90 degrees counter-clockwise on the Y-axis. Used in the Dgun weapon in OTA for some reason, but doesn't need to be limited to that.
4: Uses an animation from FX.gaf for the weapon's appearance. The Color tag specifies which animation it uses:

    Color=0 makes it use "cannonshell"
    Color=1 and 4 makes it use "PlasmaSm"
    Color=2 makes it use "PlasmaMd"
    Color=3 makes it use "ultrashell"
    Color=5 - 255 shows nothing, so the weapon is invisible (not all tested)

5: Flamethrower. Uses the animation "flamestream" from FX.gaf. Animation speed is dependent on WeaponTimer and the game will crash without it.
6: 3D model like a missile, not rotated. Used in bombs in OTA, but doesn't need to be limited to them.
7: Lightning, with the same drawing behavior as lasers.`,

`
Weapon will ignore gravity and fire straight at the target. At the end of the Range or WeaponTimer, it will disappear if it didn't hit anything.
Required for: SmokeTrail and SmokeDelay.
Overrides: Ballistic and Dropped.`,

`
Weapon will fire in a calculated arc based on gravity, the distance it is firing, and WeaponVelocity. If WeaponVelocity is too low, the unit won't be able to fire from its full range and will need to get closer before it tries. At the end of the Range or WeaponTimer, it will fall to the ground and explode.
Requires: Turret.
Overrides: Dropped.`,

`
Weapon does not fire forward but instead drops. If the unit is moving, the weapon will fall forward based on the speed the unit was going and gravity. Range and speed of unit determines how far away the weapon can be dropped from the target.
Conflicts with: Turret.`,

`
Weapon will call and wait until the appropriate AimPrimary/AimSecondary/AimTertiary script returns "1" before it can fire.
Required for: Ballistic.
Overrides: Vlaunch.
Conflicts with: Dropped.`,

`
Weapon will fire straight up in the air instead of forward during the first phase. It calls and waits for the appropriate AimPrimary/AimSecondary/AimTertiary script to return "1" before it can fire, but the "heading" and "pitch" variables equal 0.
Requires: SelfProp.
Overrides: Tolerance.
Conflicts with: Turret.`,

`
The 3D model used in RenderType 1, 3, and 6 weapons.
Requires: RenderType to equal 1, 3, or 6.
Required for: Propeller.`,

`
The maximum distance in pixels the target can be from the attacking unit for it to be able to fire this weapon. For Ballistic weapons, it also must have a high enough WeaponVelocity. The first phase also ends once the weapon has flown this distance unless a longer WeaponTimer is set.`,

`
The number of seconds before the weapon can fire again after it already fired. It is in increments of game ticks, rounded down. Game ticks are 1/30 of a second, or 0.03 repeating. Consult the following chart:

    0 to 0.066 = one shot every tick, or 30 times a second.
    0.067 to 0.099 = one shot every other tick, or 15 times a second.
    0.1 to 0.133 = one shot every 3 ticks, or around 10 times a second.
    0.134 to 0.166 = one shot every 4 ticks, or around 8 times a second.
    0.167 to 0.199 = one shot every 5 ticks, or around 6 times a second.

I don't think there is an upper limit, but setting it to 1 will make it shoot 1 every 30 ticks, or 1 per second, etc. The fastest a weapon can fire is 30 times per second, but it requires Turret to equal 0. This is because a "Turret" weapon, even if it doesn't need to wait for pieces to turn to headings, has to wait a minimum of 1 game tick each shot to check if the Aim script returned 1 or "TRUE". For Stockpile weapons, ReloadTime is how long the weapon takes to be built.`,

`
The amount of energy the weapon uses when it fires. You must have the full amount for it to fire. For Stockpile weapons, this is the total amount of energy it takes over the length of the weapon being built.`,

`
Same as EnergyPerShot, but for metal.`,

`
The number of seconds the first phase lasts for instead of by Range.
Requires: Burst or NoAutoRange.
Required for: NoAutoRange.`,

`
Maximum attainable speed the weapon travels at in pixels/second. This also overrides the Range tag for Ballistic weapons. The game updates the weapon's position every game tick and checks if an enemy unit, feature, or terrain/ground is also at that location. If the WeaponVelocity is high enough, it can seem to pass through things. What is really happening is that the object is between the 2 points that the weapon occupies from one game tick to the next. A WeaponVelocity of 960 is the highest value a weapon can have before units with a FootPrintX or Z of 2 can fit between the points. If you have units with a FootPrintX or Z of 1, the highest WeaponVelocity to never "pass through" them is 480.
Required for: WeaponAcceleration.
Overrides: Range tag for Ballistic weapons.`,

`
The speed the weapon starts traveling at. Default is 0. Without WeaponAcceleration, it will just travel the WeaponVelocity speed. If there is no WeaponVelocity set, weapon will travel this speed.`,

`
The number of pixels per second that the speed the weapon travels increases from the StartVelocity to the WeaponVelocity.
Requires: SelfProp and WeaponVelocity.`,

`
The rate the weapon can change its direction in angular units per second. 65536 angular units equals 360 degrees, so TurnRate of 65536 is one full circle per second, whereas 16384 is one full circle per 4 seconds. The highest value is 655360. Anything higher than that is the same as that.
Requires: SelfProp.
Required for: Guidance and Tracks.`,

`
The diameter (not radius like you'd expect it to be) in pixels of the spherical area that damage will be dealt to once this weapon explodes.`,

`
The percentage of the total damage that a weapon's explosion does to units at the edge of its AreaOfEffect. 1 = 100%, but this can be higher than 1. If it is set to 100, for example, the damage done at the outer edge of its AreaOfEffect will be 100 times the damage done in the center. Default is 0. Damage dealt is gradually changed from the center of the explosion to the percentage specified as you move toward the outside edge.`,

`
The number of shots that will be fired per reload. It also does the same thing as NoAutoRange. If weapon is Ballistic, a WeaponTimer needs to be set or the game will crash. It also makes Ballistic weapons disappear at the end of the WeaponTimer if it runs out before it makes it to the target or the ground. The angle of the target is only calculated for the first shot of the Burst and all other shots of the Burst fire at the same angle from the firing unit, even if the firing unit moves. The first shot of each Burst will have one more game tick delay before it fires than the rest of the shots in the same Burst. So a Burst of 30, a BurstRate of 0, and a ReloadTime of 1 will make a continuous stream of fire like you'd expect. But if it didn't have that extra delay before the first shot, it would be firing the first shot of the next Burst at the same time as the last shot of the previous Burst with those settings. It also means that having a Burst of 1 will make it wait the BurstRate plus 1 more game tick between shots than it would with no Burst at all. That's useful considering the fact that the firing angle isn't recalculated once it starts firing the Burst, so moving the firing piece in FirePrimary/FireSecondary/FireTertiary will move it during that delay and it will actually fire from where you moved the piece to, but it will still fire at the original angle it calculated. It should be remembered, however, that the fire script is only run once per Burst.
Required for: BurstRate, SprayAngle, RandomDecay, and (if no NoAutoRange) WeaponTimer.
Overrides: NoAutoRange.`,

`
The time in seconds before each shot in a Burst, including the first one. Burst shots can fire up to 30 shots per second, so a BurstRate of 0.06 or lower is the same as 0 or not even including the tag at all. Like ReloadTime, it rounds down to the nearest shot per game tick.
Requires: Burst.`,

`
The maximum angular units a Burst shot can be fired at away from the angle of the target. 0 equals always straight at target, 32767 equals 90 degrees left and right of straight, and 65535 equals in the opposite direction. 65536 is the same as 0. Weapons will fire at a random angle between straight at the target and this deviation. The first shot of a burst always fires straight at the target.
Requires: Burst higher than 1.`,

`
The maximum time in seconds that is added to or subtracted from the WeaponTimer for a weapon with Burst. The time added or subtracted is a random number between the WeaponTimer and the WeaponTimer +/- this value. No WeaponTimer assumes WeaponTimer is 0.
Requires: Burst.`,

`
For RenderType 0 and 7 weapons, it lets the Duration set how long the beam is drawn for. Without this tag, the beam is drawn until the front of the laser or lightning hits something or goes off the map.
Requires: RenderType 0 or 7.
Required for: Duration.`,

`
How long in seconds RenderType 0 and 7 weapons draw the beam from the front of the projectile.
Requires: RenderType to equal 0 or 7 and BeamWeapon.`,

`
The color of the laser or lightning. The following is a chart of what numbers you need to make Color equal for it to be the corresponding color: https://www.tauniverse.com/forum/attachment.php?attachmentid=30848&d=1387156641
It also specifies the GAF animation to use for RenderType 4 weapons.
Requires: RenderType 0, 4, or 7.`,

`
Makes a duplicate laser beam on the bottom of the main one that is the color specified. It only works on lasers, not lightning. If it is the same color as the Color tag, the beam will appear thicker. If a different color, it will appear 2-toned. It uses the same color chart as Color. If Color is not set, the main beam is black over this color. If this tag is not set, the beam is only the color specified in Color.
Requires: RenderType 0.`,

`
The WAV file that will play when the weapon is fired.
Requires: Speakers.`,

`
The WAV file that will play when the weapon explodes.`,

`
The SoundStart will play for each Burst shot. Otherwise it will only play once for the first shot of each Burst.
Requires: Burst.`,

`
The WAV file that will play when the weapon hits water.`,

`
The maximum angular units a weapon can be fired at away from the angle of the target, as well as above or below the target. 0 equals always straight at target, 32767 equals 90 degrees left and right and up and down of straight, and 65535 equals in the opposite direction. 65536 is the same as 0. Weapons will fire at a random angle between straight at the target and this deviation. For a Burst, all the Burst shots are fired at the same angle.
Requires: Ballistic.`,

`
The percent chance that the weapon's explosion will cause damaged trees and foliage to catch fire. 0 to 100.`,

`
Smoke will emit from the weapon.
Requires: LineOfSight.
Required for: SmokeDelay.`,

`
The number of seconds between smoke puffs. Anything lower than 0.067 is the same as 0 or not including the tag at all.
Requires: LineOfSight and SmokeTrail.`,

`
A puff of smoke will be emitted when the weapon is fired, or at the beginning of each Burst.`,

`
A puff of smoke will be emitted when the weapon explodes. Too much smoke if you ask me. Let's get into some good stuff.`,

`
Weapon will turn to follow the target, determined by TurnRate and WeaponVelocity, for the duration of the Range or WeaponTimer, whichever comes first. If WeaponTimer ends first, it will fly straight for the remainder of the Range and then fall to the ground. If Range ends first, it will fall to the ground.
Requires: SelfProp and TurnRate.`,

`
Weapon will turn to follow the target, determined by TurnRate and WeaponVelocity, for the duration of the FlightTime, during the second phase.
Requires: SelfProp, TurnRate, TwoPhase, and FlightTime.`,

`
Is required for several of the tags to work. It makes LineOfSight weapons fall to the ground after they are done instead of merely disappearing. It also allows BurnBlow to work for a LineOfSight weapon. If a SelfProp weapon doesn't hit something or blow up with BurnBlow, it will continue on until the end of the game or until it goes off the map, so NoExplode with SelfProp will continue exploding forever and GroundBounce ones will continue to the end of the map if they don't hit something. Also, it makes lasers and lightning weapons draw the beam until the weapon hits something or goes off the map, regardless of the Duration tag.
Required for: Vlaunch, TurnRate, Guidance, TwoPhase, FlightTime, and Tracks. Also enables BurnBlow for LineOfSight weapons.
Overrides: Ballistic, SprayAngle, Accuracy, Duration, and BeamWeapon.`,

`
Weapon has a second phase. It starts at the end of the Range unless NoAutoRange or Burst is set, then it starts at the end of the WeaponTimer.
Requires: SelfProp and FlightTime.
Required for: FlightTime and Tracks.
Overrides: Guidance.`,

`
The length of time in seconds the second phase lasts for.
Requires: SelfProp and TwoPhase.
Required for: TwoPhase and Tracks.`,

`
The weapon will continue to be guided by Guidance past the end of the Range until the WeaponTimer is up. Otherwise it would become unguided and fly straight past the Range. Also makes TwoPhase and BurnBlow happen at the end of the WeaponTimer instead of the end of the Range. It only affects the first phase, so Tracks will continue to follow the target in the second phase past the Range whether this tag is set or not.
Requires: WeaponTimer.
Required for: WeaponTimer (if no Burst).`,

`
Weapon will maintain altitude gained through Vlaunch until it gets near the target.
Overrides: Guidance. Also overrides Tracks and TurnRate after it has turned to fly forward.`,

`
Spins the second piece of the 3D model if there is one.
Requires: RenderType 1, 3, or 6 and Model.`,

`
Allows unit to fire at underwater units. Also allows weapon to be fired from underwater and to travel through water instead of exploding. Weapon cannot target units in the air. If the weapon is fired from underwater, it also can't target units on land, including hover units. If fired from land and not Dropped, it will act like Ballistic, except it will start out firing straight. Guidance, TurnRate, SelfProp, etc. only works while it is underwater.`,

`
Instead of falling to the ground at the end of the Range, the weapon will explode in the air. If SelfProp and NoAutoRange/Burst is set, it will explode at the end of the WeaponTimer instead, whether that is shorter or longer than the Range. LineOfSight weapon requires SelfProp for BurnBlow to work.
Requires: Ballistic or SelfProp.
Overrides: TwoPhase, FlightTime, and Tracks.`,

`
The number of angular units the target must be in relation to the heading given by the engine. A Tolerance of 0 (or not present at all) is the same as 182, or 1 degree, so a specific number from 1 - 181 actually has less Tolerance than 0. This tag does different things depending on other factors of the weapon. If the weapon has Turret=0, then the attacking unit must be facing the target within the Tolerance range for the weapon to fire at it. If a low number like 1 or 0, the unit must be facing straight at the target. If 32768, the unit must be facing within 90 degrees left or right of the target. If 65536, the weapon will fire no matter where the target is in relation to the heading of the unit. For weapons with Turret=1 and Ballistic=1, it is similar to non-turreted weapons. The only difference is that the target heading is compared to the firing piece that the weapon comes from instead of the heading of the attacking unit itself.

For a Turret=1, LineOfSight weapon, it has nothing to do with the direction that the unit, aiming piece, or firing piece is facing. It is the number of angular units that the target must be within, since the last time it checked the heading of the target, for it to fire without recalculating the heading. If the target's heading hasn't changed at all since the last time the engine checked, it will fire at the target no matter what heading it is at and no matter what direction the firing or aiming piece is pointed at, even if Tolerance is 0 or 1. When a weapon with Turret=1 first gets a target, it checks the heading, passes it to the Aim script, then checks it again once the Aim script returns 1 or TRUE. If the target's heading has changed more than the Tolerance, it won't fire and must do it again. As soon as the weapon fires, it checks the heading again to get ready for next time. Once the ReloadTime is done, it checks to see if the target's heading has changed outside the Tolerance amount. If not, it fires again and repeats. If it has, it must recalculate and run the Aim script again.`,

`
Same as Tolerance, but for up and down instead of left and right. Used for Ballistic weapons.`,

`
Instead of doing damage, the weapon will paralyze the units it affects. The length of paralysis is specified by the amount of damage it does. 60 damage equals 1 second.`,

`
The lowest angle a Ballistic weapon's firing piece can turn down to. 0 would mean it can move from straight ahead to 45 degrees in the air. -10 means it can turn within 10 and 45 degrees. It is to prevent some Ballistic weapons from firing at units closer than a certain distance.
Requires: Ballistic.`,

`
The number of seconds the weapon waits before firing at a target once it is within the Range distance and Tolerance angle. It is to help prevent slow and long-distance weapons from firing at faster-moving units that it probably won't hit anyway.`,

`
Weapon has to be built by clicking a build button before being fired. ReloadTime determines the time it takes to build the weapon and EnergyPerShot and MetalPerShot determine the energy and metal required to build it over that period.`,

`
Weapon will fire at other weapons within the Coverage area that have the Targetable tag as long as this weapon was Stockpiled. Its explosion will also destroy other weapons. Also changes the icon on the minimap for this weapon to be an X.
Requires: Coverage.
Required for: Coverage.`,

`
The maximum distance in pixels a Targetable weapon can be for an Interceptor weapon to fire at it.
Requires: Interceptor.
Required for: Interceptor.`,

`
Makes the weapon be able to be targeted by Interceptor weapons. Also changes the icon on the minimap for this weapon to be an X.`,

`
The weapon will not lock onto or fire at a target automatically and must be manually told to attack. It will also only fire once, needing to be manually told to attack again for each shot. It will fire all the shots in a Burst, however.`,

`
The distance in pixels the screen will shake when the weapon hits something. If the screen is already shaking from a previous weapon, this value will be added to that one.
Requires: ShakeDuration.
Required for: ShakeDuration.`,

`
The time in seconds the screen shakes for.
Requires: ShakeMagnitude.
Required for: ShakeMagnitude.`,

`
Weapon will not show up on the minimap.`,

`
Weapon will not explode when it hits the ground and will turn to travel along the ground regardless of what angle it was flying at when it hit the ground. All guidance and tracking still works as if it didn't hit anything. If there is no BurnBlow, a SelfProp weapon with this tag will continue until it hits something or goes off the map.`,

`
Weapon will not explode when it hits the ground or features like corpses, trees, and rocks. If will go through and under the ground unless the GroundBounce tag is set to 1. It will only explode when it hits enemy units (normal weapons don't explode on allied units anyway). If there is no BurnBlow, a SelfProp weapon with this tag will continue until it hits an enemy unit or goes off the map.`,

`
When the weapon explodes, it won't disappear and will instead keep going until the end of the weapon's Range, causing explosions whenever it hits anything on the way. If NoAutoRange or Burst is set, the weapon will disappear at the end of the WeaponTimer instead of Range. If SelfProp is set with this tag, the weapon will continue until it goes off the map, no matter what. Sometimes some will stay even after that and continue falling from the top of the map to the bottom over and over, eventually causing other weapons to not display. This same behavior can happen with UnitsOnly and even GroundBounce ones with SelfProp if they don't hit something. Weapons with Guidance or Tracks will keep circling and hitting the target until the end of the first or second phase, respectively, then become unguided and fly off the map, but since both require SelfProp, it isn't recommended.`,

`
Weapon can only target and fire at units in the air. VTOL units need to be in the air to be fired at.`,

`
The GAF file that contains the animation that shows by default when the weapon explodes.
Requires: ExplosionArt.
Required for: ExplosionArt.`,

`
The name of the animation inside the GAF defined in ExplosionGAF that shows by default when the weapon explodes.
Requires: ExplosionGAF.
Required for: ExplosionGAF.`,
`
WaterExplosionGAF, WaterExplosionArt, LavaExplosionGAF,and LavaExplosionArt all do the same as ExplosionGAF and ExplosionArt, just for when exploding on or in the air over water or lava, respectively.`,

`
Default shows how much damage this weapon does after a direct hit on a unit. Only whole numbers are recognized, no decimals. This can be a negative value and it will increase the target's health instead of decreasing it. But this type of increase won't stop at their max health and it causes bugs if done carelessly. Unit names such as ARMCOM can be specified to have the weapon do a different amount of damage to that specific unit instead of Default. If the weapon does no damage, such as Interceptor ones, the whole damage section can be omitted with no ill effects.`,

`
Specifies how quickly the firing piece turns in the UnitViewer program. Affects nothing in the game.`,

`
Does absolutely nothing. `]