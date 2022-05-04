# tapi
API For Total Annihilation unit configuration
<h1> Example code </h1>
<code>
	
const tapi = require('./tapi');
(function(){
	if(tapi.init('hpi_out', verbose = false)) {
		if(tapi.units.bind(target_folder = 'UNITS') && tapi.weapons.bind(target_folder = 'Weapons')) {
			if(tapi.units.build() && tapi.weapons.build()) {
				let units;
				
				units = tapi.units.__search(field='side', value='CORE').__search(field='buildcostmetal').__foreach(vartype='normal', 'buildcostmetal', 'return buildcostmetal*=1.02');
				tapi.units.comit(units);
				
				units = tapi.units.__search(field='side', value='ARM').__search(field='buildcostenergy').__foreach(vartype='normal', 'buildcostenergy', 'return buildcostenergy*=1.02');
				tapi.units.comit(units);
				
				if(tapi.units.compile(overwrite = false)) {
					console.log('succesfully compiled all changes!');
				}	

				let weapons = tapi.weapons.__search();
				console.log('There are', weapons.__count(), 'total weapons');
				
				weapons = weapons.__search(field = 'range', value='>900');
				console.log('The following weapons have over 900 range, (', weapons.__count('excluded'), ' weapons not included have below 900 range )');	
				console.log(weapons.__getall(vartype='normal','name').join(', '));
				
				weapons.__foreach(vartype='normal', 'range', 'return range *= 1.25');
				console.log('increased listed weapons range by 25%');
				tapi.weapons.comit(weapons);

				if(tapi.weapons.compile(overwrite = false)) {
					console.log('succesfully compiled all changes!');
				}				
			}
		}
	}
})();
	
</code>
