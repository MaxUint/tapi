function log() 
{
	console.log(__filename.slice(__filename.lastIndexOf('\\')+1)+' \t: ', ...arguments);
}


const tapi = require('./tapi');
const tapiserver = require('./tapi/tapiserver');
log('Main script');



/*
let myEngine = tapi.load(engineName);

let engineName = "myEngine";
let takeFromSource = "hpi_out";
let folderBinds =({
	units:'UNITS', 
	weapons:'Weapons', 
	features:'features', 
	guis:'guis', 
	downloads:'download'
});



if(!myEngine) {
	myEngine = tapi.create(({	
		name:(engineName), 
		source:(takeFromSource), 
		folders:(folderBinds)
	}));
};

//myEngine.compile();

console.log('current build number', myEngine.version);

let units = myEngine.units;
				
		console.log('changing all core metal costs to +200% and all arm energy costs to +200%');
		
		units.commit(
			units.__search(field='side', value='CORE').__search('buildcostmetal').__foreach(vartype='normal', 'buildcostmetal', 'return buildcostmetal*=2')
		);
		
		units.commit(
			units.__search(field='side', value='ARM').__search('buildcostenergy').__foreach(vartype='normal', 'buildcostenergy', 'return buildcostenergy*=2')
		);

let weapons = myEngine.weapons;
		
		console.log('There are', weapons.__search().__count(), 'total weapons');
		
		weapons = weapons.__search(field = 'range', value='>900');
		console.log('The following weapons have over 900 range, (', weapons.__count('excluded'), ' weapons not included have below 900 range )');	
		console.log(weapons.__getall(vartype='normal','name').join(', '));
		
		weapons.__foreach(vartype='normal', 'range', 'return range *=0.5');
		console.log('decrease listed weapons range by 200%');
		tapi.weapons.commit(weapons);


let features = myEngine.features;
		
		features.commit(
			features.__search('seqname', 'acidmetal01').__foreach(vartype = 'normal', 'height', 'return height+=2')
		);
		
		console.log('acidmetal01 height is now', features.__search('seqname', 'acidmetal01').__getall(vartype = 'normal', 'height'));
		
myEngine.compile();

console.timeEnd('tapi script ran in');

//*/