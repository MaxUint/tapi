const fs = require('fs');
const pers = require('./persistance');

pers.save('memory', {HelloWorld:'Memory loaded'});
console.log(pers.load('memory').HelloWorld);
pers.deleteCache();

const formats = {'units':'.fbi', 'weapons':'.tdf', 'features':'tdf', 'guis':'.gui', 'downloads':'.tdf'};

function makeUnitField(cache, excluded = {}, mergeExclude = {}) {
	let tempField = new unitField();
	
	for(const key in mergeExclude) {
		tempField[key] = mergeExclude[key];
	}
	for(const key in cache) { if(cache.hasOwnProperty(key)) {
		tempField[key] = cache[key];
	}};
	for(const key in excluded) {
		tempField.__proto__.__excluded[key] = excluded[key];
	}
	
	return tempField;
}


function advancedTdfSearch(field = '', value = '', tdfObj) {
	for(const key in tdfObj) {
		if(tdfObj.hasOwnProperty(key)) {
			if(key.includes(field) || field == '') {
				
				if(typeof tdfObj[key] == 'string') {
					if(tdfObj[key].includes(value) || value == '') {
						return true;
					}	
				}
				
				if(typeof tdfObj[key] == 'number') {
					if(tdfObj[key] == value || value == '') {
						return true;
					}
					
					
					if('<>'.includes(value[0])) { 
						if(value.slice(0,1) == '<' && value.slice(1,2) != '=') {
							let n = parseFloat(value.slice(1));
							if(typeof n == 'number') {
								return (parseFloat(tdfObj[key]) < n);
							}
						}
						if(value.slice(0,1) == '>' && value.slice(1,2) != '=') {
							let n = parseFloat(value.slice(1));
							if(typeof n == 'number') {
								return (parseFloat(tdfObj[key]) > n);
							}
						}
						if(value.slice(0,2) == '>=') {
							let n = parseFloat(value.slice(2));
							if(typeof n == 'number') {
								return (parseFloat(tdfObj[key]) >= n);
							}
						}
						if(value.slice(0,2) == '<=') {
							let n = parseFloat(value.slice(2));
							if(typeof n == 'number') {
								return (parseFloat(tdfObj[key]) <= n);
							}
						}
					}
					
					
					
				}
			} 
			
		}
	}
	return false;
}

class unitField {
	constructor() {
		this.__proto__.__excluded = {};
		this.__proto__.__search = function(variable = '', data = '') { 
			let newCache = {};
			let excluded = this.__excluded;
			for(const key in this) { 
				if(this.hasOwnProperty(key)) {
					let isResult = true;
					let tempObj = this[key];
					if(advancedTdfSearch(variable, data, tempObj.normal)) {
						newCache[key] = tempObj; continue;
					}
					if(advancedTdfSearch(variable, data, tempObj.common)) {
						newCache[key] = tempObj; continue;
					}
					if(advancedTdfSearch(variable, data, tempObj.version)) {
						newCache[key] = tempObj; continue;
					}
					if(advancedTdfSearch(variable, data, tempObj.damage)) {
						newCache[key] = tempObj; continue;
					}
					excluded[key] = tempObj;
				}
			}
			return makeUnitField(newCache, excluded);
		};
		this.__proto__.__foreach = function(vartype, variable, func) {
			if(['normal', 'version', 'damage', 'common'].includes(vartype)) {
				
				for(const key in this) { if(this.hasOwnProperty(key)) {
						
						if(typeof this[key][vartype][variable] != 'undefined') {
							let newValue = ((new Function(variable, func))( this[key][vartype][variable]));
							 this[key][vartype][variable] = newValue;
						} else {
							console.warn(this[vartype][key][variable], 'error', variable, 'at', key, 'does not exist');
						}
						
				}};

			} else {
				console.warn('vartype incorrect');
			}
			return this;
		};
		
		this.__proto__.__getall = function(vartype, variable) {
			let tempArr = [];
			if(['normal', 'version', 'damage', 'common'].includes(vartype)) {
				
				for(const key in this) { if(this.hasOwnProperty(key)) {
						
						if(typeof this[key][vartype][variable] != 'undefined') {
							tempArr.push(this[key][vartype][variable]);
						} else if(exports.verbose) {
							console.warn(this[vartype][key][variable], 'error', variable, 'at', key, 'does not exist');
						}
						
				}};

			} else {
				console.warn('vartype incorrect');
			}
			return tempArr;
		};
	
		this.__proto__.__count = function(type = '') {
			if(type == 'excluded') {
				return (Object.keys(this.__excluded).length);
			}
			return (Object.keys(this).length);
		};
	}
}

class gadgetField {
	constructor(filename = '', foldername = '', gadgetname = '', name = ''){
		
		this.common = {};
		this.normal = {};
		this.version = {};
		this.damage = {};
		this.__proto__.__filename = filename;
		this.__proto__.__foldername = foldername;
		this.__proto__.__gadgetname = gadgetname;
		this.__proto__.__name = name;

	}
}

class archClass {
	constructor(type) {
		this.archetype = type;
		this.built 	 = 	false;
		this.format  = 	formats[type];
		this.cache   =  new unitField();
		this.__proto__.__search = function(term1, term2){ return this.cache.__search(term1, term2)};
		//this.importCSV = function() 		{ return exports.importCSV(type, format); };
		//this.exportCSV = function() 		{ return exports.exportCSV(type, format); };
	};
	bind(target)				{	return bind(this.archetype, target);			};
	build()						{	return build(this.archetype);					};
	compile(overwrite=false)	{	return compile(this.cache, this.archetype, this.format, this.location, overwrite);		};
	comit(results) 				{  this.cache = makeUnitField(results, {}, results.__excluded);  return true; };
}

exports.units = 	new archClass('units');
exports.weapons =	new archClass('weapons');
exports.features = 	new archClass('features');
exports.guis = 		new archClass('guis');
exports.downloads = new archClass('downloads');


const bind = function (archetype, target, rebind=false) { 
	if(!['units','weapons','features','guis','downloads'].includes(archetype)) {
		console.error("Invalid tdf archetype, choose 'units' 'weapons' 'features' 'guis' or 'downloads'");
		return false;
	}
	if(!fs.existsSync(exports.hapiFolder + '\\' + target)) {
		console.error("Invalid folder binding location");
		return false;
	}
	if(typeof exports[archetype].location == 'undefined' || rebind) {
		exports[archetype].location = (exports.hapiFolder + '\\' + target);
		if(exports.verbose) console.log('verbose: ' + archetype + " succesfully bound");
		return true;
	}
	console.error(`${archetype} already bound too ${exports[archetype].target} to overwrite include rebind=true`);
	return false;
}

const compile = function(cache, archetype, format, location, overwrite=false) { 
	if(exports.verbose) console.time('verbose: ' + archetype + '\t compiled in \t ');
	try {
		if(typeof exports.hapiFolder == 'undefined') {
			console.log('improper init()!');
			return false;
		}

		let target_path = location + (overwrite ? '' : '_new');	
		
		var entries = [];
		let data = cache;
		
		for(const key in data) {
			if(data.hasOwnProperty(key)) {
				entries.push(data[key]);
			}
		}

		fs.rmSync(target_path, { recursive: true, force: true });
		fs.mkdirSync(target_path);
		
		entries.forEach(function(entry){
			let gadget = [];
			gadget.push('['+entry.__gadgetname+']');
			gadget.push('{');
			
			for(key in entry.normal){
				if(entry.normal.hasOwnProperty(key) && typeof entry.normal[key] !== 'object') {
					gadget.push(`\t${key}=${entry.normal[key]};`);
				}
			}

			if(Object.keys(entry.common).length) {
				gadget.push('\t\t[COMMON]');
				gadget.push('\t\t{');
				for(key in entry.common){
					if(entry.common.hasOwnProperty(key)) {
						gadget.push(`\t\t\t${key}=${entry.common[key]};`);
					}
				}
				gadget.push('\t\t}');
			}
			
			if(Object.keys(entry.version).length) {
				gadget.push('\t\t[VERSION]');
				gadget.push('\t\t{');
				for(key in entry.version){
					if(entry.version.hasOwnProperty(key)) {
						gadget.push(`\t\t\t${key}=${entry.version[key]};`);
					}
				}
				gadget.push('\t\t}');
			}
			
			if(Object.keys(entry.damage).length) {
				gadget.push('\t\t[DAMAGE]');
				gadget.push('\t\t{');
				for(key in entry.damage){
					if(entry.damage.hasOwnProperty(key)) {
						gadget.push(`\t\t\t${key}=${entry.damage[key]};`);
					}
				}
				gadget.push('\t\t}');
			}
			
			gadget.push('}\n\n');
			appendToo(gadget.join('\n'), target_path + '\\' + entry.__filename + format);
		});

		function appendToo(data, target) {

			let noneFolderTarget = target.replace(target_path + '\\', '');
			
			if(noneFolderTarget.includes('\\')) {
				let folder = noneFolderTarget.split('\\')[0];
				if(!fs.existsSync(target_path + '\\' + folder)){
					fs.mkdirSync(target_path + '\\' + folder);
				}
			}
			
			if(!fs.existsSync(target)){
				fs.writeFileSync(target, '', function (err) {
					if (err) throw err;
				});
			}
			fs.appendFileSync(target, data, 'latin1');
		}
	} catch (e) {
		return false;
	}
	
	if(exports.verbose) console.timeEnd('verbose: ' +archetype + '\t compiled in \t ');
	return true;
}

const build = function (archetype) { 
	if(typeof exports[archetype].location == 'undefined') {
		console.error(archetype + " not bound");
		return false;
	}
	let target_path = exports[archetype].location;
	
	let files = readdirRecursive(target_path, exports[archetype].format);
	
	
	
	let filename;
	let folder;
	let gadgetName;
	let cache = exports[archetype].cache;
	
	files.forEach(function(tdf_file) {

		let text = formatTDF(fs.readFileSync(target_path + '\\' + tdf_file, 'latin1'));
			
		if(isValidate(tdf_file, text)) {
			console.error('skipping file due to invalidation', tdf_file);
			return false;
		}
		
		//new array of each gadget in file
		let gadgets = digestGadgets(text).split('[').slice(1).map(x => '['+restoreGadgets(x));
		
		filename = tdf_file.slice(tdf_file.lastIndexOf('\\')+1, tdf_file.lastIndexOf('.'));
		
		
		folder = tdf_file.slice(0, tdf_file.indexOf('\\')+1);
		if(folder == filename.replace(exports[archetype].format, '')) {
			folder = '';
		} else {
			folder = folder.replace('\\', '');
		}
			
		gadgets.forEach(function(gadget) {
			
			gadgetName = gadget.slice(gadget.indexOf('[')+1, gadget.indexOf(']'));
			let gadgetObj = new gadgetField(filename, folder, gadgetName);
			gadget = gadget.slice(gadget.indexOf('{')+1, gadget.lastIndexOf('}'));

			let prefix = '';
			gadget.split('\n').forEach(function(line) {
				if(prefix != '' && line.includes('}')) {
					prefix = '';
				}			
				if(line.includes('[') && line.includes(']')) {
					prefix = line.slice(line.indexOf('[')+1, line.indexOf(']'));
				}
				if(line.includes('=')) {
					let key = line.split('=')[0].toLowerCase();
					let value = line.slice(line.indexOf('=')+1,line.indexOf(';'));
					if(parseFloat(value).toString() === value.toString()) {
						value = parseFloat(value);
					}
					if(['COMMON','VERSION','DAMAGE'].includes(prefix.toUpperCase())) {
						gadgetObj[prefix.toLowerCase()][key] = value;
					} else {
						gadgetObj.normal[key] = value;
					}
				}
				
			});
			let name = getTdfName(gadgetObj, archetype);
			gadgetObj.__name = name;
			gadgetObj.__filename = filename;
			gadgetObj.__gadgetname = gadgetName;
			exports[archetype].cache [name] = gadgetObj;
		});
	});
	exports[archetype].built = true;
	if(exports.verbose) console.log('verbose: ' + archetype + " succesfully built");
	
	return true;
}

const exportCSV = function(archetype, format) { 
		if(exports.verbose) console.time('verbose: ' + target_folder+' to csv executed in \t ');
		if(typeof exports.hapiFolder == undefined || typeof exports.csvFolder == undefined || typeof exports.CSV_Delim == undefined) {
			console.log('improper init()!');
			return false;
		}
		if(typeof exports[archetype].location == 'undefined') {
			console.error(archetype + " not bound");
			return false;
		} 
		
		let target_path = exports[archetype].location;
		let csv_file_data = '';
		
		

		let files = readdirRecursive(target_path, format);
		let tdfObjs = [];

		files.forEach(function(file){
			tdfObjs.push(tdf2Obj(file));
		});

		if(!fs.existsSync(exports.csvFolder)){
			fs.mkdirSync(exports.csvFolder);
		}
		
		csv_file_data = TdfObjs2Table(tdfObjs);
		
		fs.writeFileSync(exports.csvFolder+'\\'+archetype+'.csv', csv_file_data, 'utf8', function (err) {
		  if (err) { throw err; }
		});

		

		function tdf2Obj(target){
			let text = formatTDF(fs.readFileSync(target, 'latin1'));
			
			if(isValidate(target, text)) {
				console.error('skipping file due to invalidation', target);
				return;
			}
			//new tdf obj
			let tdfObj = {};
			//new array of each gadget in file
			let gadgets = digestGadgets(text).split('[').slice(1).map(x => '['+restoreGadgets(x));

			let filename = target.split('\\').slice(2).join('\\').split('.')[0];
			
			gadgets.forEach(function(gadget) {
				let gadgetObj = {};
				let gadgetName = gadget.slice(gadget.indexOf('[')+1, gadget.indexOf(']'));
				
				gadget = gadget.slice(gadget.indexOf('{')+1, gadget.lastIndexOf('}'));

				let prefix = '';
				gadget.split('\n').forEach(function(line) {
					if(prefix != '' && line.includes('}')) {
						prefix = '';
					}			
					if(line.includes('[') && line.includes(']')) {
						prefix = line.slice(line.indexOf('[')+1, line.indexOf(']'));
					}
					if(line.includes('=')) {
						let key = (['COMMON','VERSION','DAMAGE'].includes(prefix.toUpperCase())?prefix+'.':'') + line.split('=')[0];
						let value = line.slice(line.indexOf('=')+1,line.indexOf(';'));
						gadgetObj[key] = value;
					}
					
				});
				
				tdfObj[filename + '.' + gadgetName] = gadgetObj;
			});
			
			return tdfObj;
		}

		function TdfObjs2Table(Tdfs) {
			
			let CSV_File = [];
			let header = [];
			
			//create table header
			Tdfs.forEach(function(TDF) {
				
				for (const gadget in TDF) {  
					if (TDF.hasOwnProperty(gadget)) {
						
						for (const variable in TDF[gadget]) {
							if(TDF[gadget].hasOwnProperty(variable)) {
								
								if(!header.includes(variable)) {
									header.push(variable);
								}
							}
						}
					}
				}
			});

			header.unshift('');

			CSV_File.push(header.join(exports.CSV_Delim)); //push first row
			
			let new_row = '';
			
			Tdfs.forEach(function(TDF){
				
				for (const gadget in TDF) {  
					if (TDF.hasOwnProperty(gadget)) {
						
						new_row = new Array(header.length);
						new_row[0] = gadget;
						
						for (const variable in TDF[gadget]) {
							if(TDF[gadget].hasOwnProperty(variable)) {
								
								let value = TDF[gadget][variable];
								let position = header.indexOf(variable);
								new_row[position] = value;
							}
						}
						CSV_File.push(new_row.join(exports.CSV_Delim));
					}
				}
			});
			
			//return csv file
			return CSV_File.join('\r\n');
		}
		
		if(exports.verbose) console.timeEnd('verbose: ' + archetype+' to csv executed in \t ');
		return true;
}

const importCSV = function(archetype, format, overwrite=false) { 
	if(exports.verbose) console.time('verbose: ' + archetype+' to tdf executed in \t ');
	
	if(typeof exports.hapiFolder == undefined || typeof exports.csvFolder == undefined || typeof exports.CSV_Delim == undefined) {
		console.log('improper init()!');
		return false;
	}
	if(typeof exports[archetype].location == 'undefined') {
		console.error(archetype + " not bound");
		return false;
	} 
	if(!fs.existsSync(csvTarget)) {
		console.log('no csv has been generated for ' + archetype + ', please use tapi.[archetype].exportCSV() first.');
		return false;
	}	let target_path = exports[archetype].location + (overwrite ? '' : '_new');
	
	let csvTarget = exports.csvFolder + '\\' + archetype + '.csv';
	let tdfs = fs.readFileSync(csvTarget, 'utf8').replaceAll('\r\n','\n').split('\n');
	let tdfs_header = tdfs.shift().split(exports.CSV_Delim);
	
	fs.rmSync(target_path, { recursive: true, force: true });
	fs.mkdirSync(target_path);

	tdfs.forEach(function(tdf){
		
		let gadget = [];
		tdf = tdf.split(exports.CSV_Delim);

		gadget.push('['+tdf[0].split('.')[1]+']');
		gadget.push('{');
		
		let Vars = {}, cVars = {}, vVars = {}, dVars = {};
		
		
		for(let i = 1;i < tdf.length; i++) {
			if(tdf[i] != '') {
				let key = tdfs_header[i];
				let value = tdf[i];
				let type = key.includes('.') ? key.split('.')[0].toUpperCase() : 'DEFAULT';
				switch(type) {
					case 'COMMON':	cVars[key.split('.')[1]] = value; break;
					case 'VERSION':	vVars[key.split('.')[1]] = value; break;
					case 'DAMAGE':	dVars[key.split('.')[1]] = value; break;
					default:		Vars[key]  = value; break;
				}
			}
		}
		
		if(Object.keys(Vars).length) {
			for(key in Vars){
				if(Vars.hasOwnProperty(key)) {
					gadget.push(`\t${key}=${Vars[key]};`);
				}
			}
		}
		
		if(Object.keys(cVars).length) {
			gadget.push('\t\t[COMMON]');
			gadget.push('\t\t{');
			for(key in cVars){
				if(cVars.hasOwnProperty(key)) {
					gadget.push(`\t\t\t${key}=${cVars[key]};`);
				}
			}
			gadget.push('\t\t}');
		}
		
		if(Object.keys(vVars).length) {
			gadget.push('\t\t[VERSION]');
			gadget.push('\t\t{');
			for(key in vVars){
				if(vVars.hasOwnProperty(key)) {
					gadget.push(`\t\t\t${key}=${vVars[key]};`);
				}
			}
			gadget.push('\t\t}');
		}
		
		if(Object.keys(dVars).length) {
			gadget.push('\t\t[DAMAGE]');
			gadget.push('\t\t{');
			for(key in dVars){
				if(dVars.hasOwnProperty(key)) {
					gadget.push(`\t\t\t${key}=${dVars[key]};`);
				}
			}
			gadget.push('\t\t}');
		}
		
		gadget.push('}\n\n');
		
		let target = tdf[0].split('.')[0];
		appendToo(gadget.join('\n'), target_path + '\\' + target + format);
	});

	function appendToo(data, target) {

		let noneFolderTarget = target.replace(target_path + '\\', '');
		
		if(noneFolderTarget.includes('\\')) {
			let folder = noneFolderTarget.split('\\')[0];
			if(!fs.existsSync(target_path + '\\' + folder)){
				fs.mkdirSync(target_path + '\\' + folder);
			}
		}
		
		if(!fs.existsSync(target)){
			fs.writeFileSync(target, '', function (err) {
				if (err) throw err;
			});
		}
		fs.appendFileSync(target, data, 'latin1');
	}
	if(exports.verbose) console.timeEnd('verbose: ' + archetype+' to tdf executed in \t ');
	return true;
}

exports.init = function(hapiFolder, verbose = false) {
	if(!fs.existsSync(hapiFolder)) {
		console.log('invalid root folder');
		return false;
	}
	exports['hapiFolder'] = hapiFolder;
	exports['csvFolder'] = 'tapi\\csv';
	exports['CSV_Delim'] = '\t';
	exports.verbose = verbose;
	return true;
};
function getTdfName(gadgetObj, archetype) {
	if(archetype == 'units') { 
		return gadgetObj.normal.unitname;
	}
	if(archetype == 'weapons') {
		return gadgetObj.__gadgetname;
	}
	if(archetype == 'features') {
		return gadgetObj.normal.seqname;
	}
	if(archetype == 'downloads') {
		return gadgetObj.normal.unitname + '.' + gadgetObj.__gadgetname;
	}
	if(archetype == 'guis') {
		return gadgetObj.__filename + '.' + gadgetObj.__gadgetname;
	}
}
function readdirRecursive(rdTarget, format) { //one layer deep only
	let temp = [], temp2 = [];
	let dir = fs.readdirSync(rdTarget);
	dir.forEach(function(listing) {
		if(fs.statSync(rdTarget+'\\'+listing).isDirectory()) {
			temp2 = fs.readdirSync(rdTarget+'\\'+listing).map(e => listing+'\\'+e);
			temp.push.apply(temp, temp2);
		} else {
			temp.push(listing);
		}
	});
	
	temp = temp.filter(e => e.toLowerCase().includes(format));
	return temp;
}
function digestGadgets(text) {
	text = text.replaceAll('[COMMON]', '!@#COMMON');
	text = text.replaceAll('[VERSION]', '!@#VERSION');
	text = text.replaceAll('[DAMAGE]', '!@#DAMAGE');
	return text;
}
function restoreGadgets(text) {
	text = text.replaceAll('!@#COMMON', '[COMMON]');
	text = text.replaceAll('!@#VERSION', '[VERSION]');
	text = text.replaceAll('!@#DAMAGE', '[DAMAGE]');
	return text;
}
function formatTDF(tdf, debug = false) {
	tdf = tdf.replaceAll('\r\n', '\n'); //normalise newlines
	tdf = tdf.replaceAll('\t',''); //remove tabs
	
	while(tdf.includes('//')) { //remove //comments
		let i = tdf.indexOf('//');
		let i2 = tdf.slice(i+1).indexOf('\n');
		tdf = tdf.slice(0,i) + tdf.slice(i2+i+2);
	}
	
	if(debug) {
		console.log(tdf);
	}
	while(tdf.includes('/*')) { //remove /* comments
		let i = tdf.indexOf('/*');
		let i2 = tdf.slice(i+1).indexOf('*/');
		tdf = tdf.slice(0,i) + tdf.slice(i2+i+2);
	}
	
	return tdf.split('\n').map(l => l=l.trim()).join('\n'); //trim whitespaces
}
function isValidate(target, text) {
	if(target.includes('ENDGAME.GUI')) return true;
	return false;
}