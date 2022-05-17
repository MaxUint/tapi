const fs = require('fs');
const pers = require('./persistence');


function log() 
{
	console.log(__filename.slice(__filename.lastIndexOf('\\')+1)+' \t: ', ...arguments);
}


function makeExist(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}
const outputBase = (__dirname + '\\builds');
makeExist(outputBase);
const formats = {
    'units': '.fbi',
    'weapons': '.tdf',
    'features': '.tdf',
    'guis': '.gui',
    'downloads': '.tdf',
	'gamedata': '.tdf'
};

function makeUnitField(cache, excluded = {}, mergeExclude = {}) {
    let tempField = new unitField();
    for (const key in mergeExclude) {
        tempField[key] = mergeExclude[key];
    }
    for (const key in cache) {
        if (cache.hasOwnProperty(key)) {
            tempField[key] = cache[key];
        }
    };
    for (const key in excluded) {
        tempField._excluded[key] = excluded[key];
    }
    return tempField;
}

function advancedTdfSearch(field = '', value = '', tdfObj) {
    for (const key in tdfObj) {
        if (tdfObj.hasOwnProperty(key)) {
            if (key.includes(field) || field == '') {
                if (typeof tdfObj[key] == 'string') {
                    if (tdfObj[key].includes(value) || value == '') {
                        return true;
                    }
                }
                if (typeof tdfObj[key] == 'number') {
                    if (tdfObj[key] == value || value == '') {
                        return true;
                    }
                    if ('<>'.includes(value[0])) {
                        if (value.slice(0, 1) == '<' && value.slice(1, 2) != '=') {
                            let n = parseFloat(value.slice(1));
                            if (typeof n == 'number') {
                                return (parseFloat(tdfObj[key]) < n);
                            }
                        }
                        if (value.slice(0, 1) == '>' && value.slice(1, 2) != '=') {
                            let n = parseFloat(value.slice(1));
                            if (typeof n == 'number') {
                                return (parseFloat(tdfObj[key]) > n);
                            }
                        }
                        if (value.slice(0, 2) == '>=') {
                            let n = parseFloat(value.slice(2));
                            if (typeof n == 'number') {
                                return (parseFloat(tdfObj[key]) >= n);
                            }
                        }
                        if (value.slice(0, 2) == '<=') {
                            let n = parseFloat(value.slice(2));
                            if (typeof n == 'number') {
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
        this._excluded = {};
        this.__proto__.__search = function(variable = '', data = '') {
            let newCache = {};
            let excluded = this._excluded;
            for (const key in this) {
                if (this.hasOwnProperty(key) && key != '_excluded') {
                    let isResult = true;
                    let tempObj = this[key];
                    if (advancedTdfSearch(variable, data, tempObj.normal)) {
                        newCache[key] = tempObj;
                        continue;
                    }
                    if (advancedTdfSearch(variable, data, tempObj.common)) {
                        newCache[key] = tempObj;
                        continue;
                    }
                    if (advancedTdfSearch(variable, data, tempObj.version)) {
                        newCache[key] = tempObj;
                        continue;
                    }
                    if (advancedTdfSearch(variable, data, tempObj.damage)) {
                        newCache[key] = tempObj;
                        continue;
                    }
                    excluded[key] = tempObj;
                }
            }
            return makeUnitField(newCache, excluded);
        };
        this.__proto__.__foreach = function(vartype, variable, func) {
            if (['normal', 'version', 'damage', 'common'].includes(vartype)) {
                for (const key in this) {
                    if (this.hasOwnProperty(key) && key != '_excluded') {
                        if (typeof this[key][vartype][variable] != 'undefined') {
                            let newValue = ((new Function(variable, func))(this[key][vartype][variable]));
                            this[key][vartype][variable] = newValue;
                        } else {
                            log(this[vartype][key][variable], 'error', variable, 'at', key, 'does not exist');
                        }
                    }
                };
            } else {
                log('vartype incorrect');
            }
            return this;
        };
        this.__proto__.__getall = function(vartype, variable) {
            let tempArr = [];
            if (['normal', 'version', 'damage', 'common'].includes(vartype)) {
                for (const key in this) {
                    if (this.hasOwnProperty(key) && key != '_excluded') {
                        if (typeof this[key][vartype][variable] != 'undefined') {
                            tempArr.push(this[key][vartype][variable]);
                        } else if (exports.verbose) {
                            log(this[vartype][key][variable], 'error', variable, 'at', key, 'does not exist');
                        }
                    }
                };
            } else {
                log('vartype incorrect');
            }
            return tempArr;
        };
        this.__proto__.__count = function(type = '') {
            if (type == 'excluded') {
                return (Object.keys(this._excluded).length);
            }
            return (Object.keys(this).length);
        };
    }
}
class gadgetField {
    constructor(filename = '', foldername = '', gadgetname = '', name = '') {
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
        this.built = false;
        this.format = formats[type];
        this.cache = new unitField();
        this.__proto__.__search = function(term1, term2) {
            return this.cache.__search(term1, term2)
        };
        //this.importCSV = function() 		{ return exports.importCSV(type, format); };
        //this.exportCSV = function() 		{ return exports.exportCSV(type, format); };
    };
    bind(target, rebind = false) {
        return bind(this.archetype, target, rebind);
    };
    build() {
        return build(this.archetype);
    };
    compile(overwrite = false) {
		this.cache = makeNewUnitField(this.cache, {}, this.cache._excluded);
        return compile(this.cache, this.archetype, this.format, this.location, overwrite);
    };
    commit(results) {
        this.cache = makeUnitField(results, {}, results._excluded);
        return true;
    };
}
exports.units = new archClass('units')
exports.weapons = new archClass('weapons')
exports.features = new archClass('features')
exports.guis = new archClass('guis')
exports.downloads = new archClass('downloads')
exports.gamedata = new archClass('gamedata')
const bind = function(archetype, target, rebind) {
    if (!['units', 'weapons', 'features', 'guis', 'downloads', 'gamedata'].includes(archetype)) {
        log("Invalid tdf archetype, choose 'units' 'weapons' 'features' 'guis' or 'downloads'");
        return false;
    }
    if (!fs.existsSync(exports.hapiFolder + '\\' + target)) {
        return false;
    }
    if (typeof exports[archetype].location == 'undefined' || rebind) {
        exports[archetype].location = (exports.hapiFolder + '\\' + target);
        exports[archetype].folderName = target;
        if (exports.verbose) log('verbose: ' + archetype + " successfully bound");
		let logLoc = exports[archetype].location;
		if(logLoc.lastIndexOf(exports.engine.name) > 0) {
			logLoc = logLoc.slice(logLoc.lastIndexOf(exports.engine.name)+exports.engine.name.length); 
		}
		log('building', archetype, 'from', exports.engine.name+':'+exports.engine.version, 'at', logLoc);
        exports[archetype].build();
        return true;
    }
    log(`${archetype} already bound too ${exports[archetype].target} to overwrite include rebind=true`);
    return false;
}
exports.compile = function(rewrite = false) {
	try {
	exports.hapiFolder = getBuildFolder();
	if(!rewrite) {
		exports.engine.version++;
	}
	newBuildFolder();
   
    if (exports.units.built) {
		exports.units.commit(exports.units.cache);
        compileMain(exports.units.cache, exports.units.archetype, formats.units, exports.units.location);
    }
    if (exports.weapons.built) {
		exports.weapons.commit(exports.weapons.cache);
        compileMain(exports.weapons.cache, exports.weapons.archetype, formats.weapons, exports.weapons.location);
    }
    if (exports.guis.built) {
		exports.guis.commit(exports.guis.cache);
        compileMain(exports.guis.cache, exports.guis.archetype, formats.guis, exports.guis.location);
    }
    if (exports.features.built) {
		exports.features.commit(exports.features.cache);
        compileMain(exports.features.cache, exports.features.archetype, formats.features, exports.features.location);
    }
    if (exports.downloads.built) {
		exports.downloads.commit(exports.downloads.cache);
        compileMain(exports.downloads.cache, exports.downloads.archetype, formats.downloads, exports.downloads.location);
    }
	if (exports.gamedata.built) {
		exports.gamedata.commit(exports.gamedata.cache);
        compileMain(exports.gamedata.cache, exports.gamedata.archetype, formats.gamedata, exports.gamedata.location);
    }
	exports.engine.timestamp = Date.now()
    exports.save();
	} catch (e) {
		return {'msg' : 'Compile Error', 'error' : e}
	}
	return {'msg':'Compiled!'};
}
const compileMain = function(cache, archetype, format, location, overwrite = false) {
	
    if (exports.verbose) console.time('verbose: ' + archetype + '\t compiled in \t ');
    try {
        if (typeof exports.hapiFolder == 'undefined') {
            log('improper init()!');
            return false;
        }
        let target_path_base = exports.mainOutput + '\\' + exports[archetype].folderName;
        let target_path = target_path_base;
        var entries = [];
        let data = cache;
        for (const key in data) {
            if (data.hasOwnProperty(key) && key != '_excluded') {
                entries.push(data[key]);
            }
        }
		log('compile main,', archetype, 'length,', entries.length);
        fs.rmSync(target_path, {
            recursive: true,
            force: true
        });
        fs.mkdirSync(target_path);
        entries.forEach(function(entry) {
            let gadget = [];
            gadget.push('[' + entry.__gadgetname + ']');
            gadget.push('{');
            for (key in entry.normal) {
                if (entry.normal.hasOwnProperty(key) && typeof entry.normal[key] != 'object') {
                    gadget.push(`\t${key}=${entry.normal[key]};`);
                }
            }
            if (entry.common && Object.keys(entry.common).length > 0) {
                gadget.push('\t\t[COMMON]');
                gadget.push('\t\t{');
                for (key in entry.common) {
                    if (entry.common.hasOwnProperty(key)) {
                        gadget.push(`\t\t\t${key}=${entry.common[key]};`);
                    }
                }
                gadget.push('\t\t}');
            }
            if (entry.version && Object.keys(entry.version).length > 0) {
                gadget.push('\t\t[VERSION]');
                gadget.push('\t\t{');
                for (key in entry.version) {
                    if (entry.version.hasOwnProperty(key)) {
                        gadget.push(`\t\t\t${key}=${entry.version[key]};`);
                    }
                }
                gadget.push('\t\t}');
            }
            if (entry.damage && Object.keys(entry.damage).length > 0) {
                gadget.push('\t\t[DAMAGE]');
                gadget.push('\t\t{');
                for (key in entry.damage) {
                    if (entry.damage.hasOwnProperty(key)) {
                        gadget.push(`\t\t\t${key}=${entry.damage[key]};`);
                    }
                }
                gadget.push('\t\t}');
            }
            gadget.push('}\n\n');
            if (archetype == 'features') {
                target_path = target_path_base + '\\' + entry.__folder;
                if (!fs.existsSync(target_path)) {
                    fs.mkdirSync(target_path);
                }
            }
            appendTo(gadget.join('\n'), target_path + '\\' + entry.__filename + format);
        });

        function appendTo(data, target) {
            let noneFolderTarget = target.replace(target_path + '\\', '');
            if (noneFolderTarget.includes('\\')) {
                let folder = noneFolderTarget.split('\\')[0];
                if (!fs.existsSync(target_path + '\\' + folder)) {
                    fs.mkdirSync(target_path + '\\' + folder);
                }
            }
            if (!fs.existsSync(target)) {
                fs.writeFileSync(target, '', function(err) {
                    if (err) throw err;
                });
            }
            fs.appendFileSync(target, data, 'latin1');
        }
    } catch (e) {
		log('Compile main error', e);
        return false;
    }
    if (exports.verbose) console.timeEnd('verbose: ' + archetype + '\t compiled in \t ');
    return true;
}
const build = function(archetype) {
    if (typeof exports[archetype].location == 'undefined') {
        log(archetype + " not bound");
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
        if (isValidate(tdf_file, text)) {
            log('skipping file due to invalidation', tdf_file);
            return false;
        }
        //new array of each gadget in file
        let gadgets = digestGadgets(text).split('[').slice(1).map(x => '[' + restoreGadgets(x));
        filename = tdf_file.slice(tdf_file.lastIndexOf('\\') + 1, tdf_file.lastIndexOf('.'));
        folder = tdf_file.slice(0, tdf_file.indexOf('\\') + 1);
        if (folder == filename.replace(exports[archetype].format, '')) {
            folder = '';
        } else {
            folder = folder.replace('\\', '');
        }
        gadgets.forEach(function(gadget) {
            gadgetName = gadget.slice(gadget.indexOf('[') + 1, gadget.indexOf(']'));
            let gadgetObj = new gadgetField(filename, folder, gadgetName);
            gadget = gadget.slice(gadget.indexOf('{') + 1, gadget.lastIndexOf('}'));
            let prefix = '';
            gadget.split('\n').forEach(function(line) {
                if (prefix != '' && line.includes('}')) {
                    prefix = '';
                }
                if (line.includes('[') && line.includes(']')) {
                    prefix = line.slice(line.indexOf('[') + 1, line.indexOf(']'));
                }
                if (line.includes('=')) {
                    let key = line.split('=')[0].toLowerCase();
                    let value = line.slice(line.indexOf('=') + 1, line.indexOf(';'));
                    if (parseFloat(value).toString() === value.toString()) {
                        value = parseFloat(value);
                    }
                    if (['COMMON', 'VERSION', 'DAMAGE'].includes(prefix.toUpperCase())) {
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
            gadgetObj.__folder = folder;
            exports[archetype].cache[name] = gadgetObj;
        });
    });
    exports[archetype].built = true;
    if (exports.verbose) log('verbose: ' + archetype + " successfully built");
    return true;
}
exports.init = function(hapiFolder, verbose = false) {
    if (!fs.existsSync(hapiFolder)) {
        log('invalid root folder');
        return false;
    }
    exports['hapiFolder'] = hapiFolder;
    exports['csvFolder'] = 'tapi\\csv';
    exports['CSV_Delim'] = '\t';
    exports.verbose = verbose;
    return true;
};

function getTdfName(gadgetObj, archetype) {
    if (archetype == 'units') {
        return gadgetObj.normal.unitname;
    }
    if (archetype == 'weapons') {
        return gadgetObj.__gadgetname;
    }
    if (archetype == 'features') {
        return gadgetObj.normal.world+'.'+gadgetObj.__gadgetname;
    }
    if (archetype == 'downloads') {
        return gadgetObj.normal.unitname + '.' + gadgetObj.__gadgetname;
    }
    if (archetype == 'guis') {
        return gadgetObj.__filename + '.' + gadgetObj.__gadgetname;
    }
	if (archetype == 'gamedata') {
        return gadgetObj.__filename + '.' + gadgetObj.__gadgetname;
    }
}

function readdirRecursive(rdTarget, format) { //one layer deep only
    let temp = [],
        temp2 = [];
    let dir = fs.readdirSync(rdTarget);
    dir.forEach(function(listing) {
        if (fs.statSync(rdTarget + '\\' + listing).isDirectory()) {
            temp2 = fs.readdirSync(rdTarget + '\\' + listing).map(e => listing + '\\' + e);
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

function formatTDF(tdf) {
    tdf = tdf.replaceAll('\r\n', '\n'); //normalize newlines
    tdf = tdf.replaceAll('\t', ''); //remove tabs
    while (tdf.includes('//')) { //remove //comments
        let i = tdf.indexOf('//');
        let i2 = tdf.slice(i + 1).indexOf('\n');
        tdf = tdf.slice(0, i) + tdf.slice(i2 + i + 2);
    }
    while (tdf.includes('/*')) { //remove /* comments
        let i = tdf.indexOf('/*');
        let i2 = tdf.slice(i + 1).indexOf('*/');
        tdf = tdf.slice(0, i) + tdf.slice(i2 + i + 2);
    }
    return tdf.split('\n').map(
		function(l){
			l = l.trim();
			if(l.includes('=') && !l.includes(';')) {
				l+=';';
			}
			return l;
		}
		).join('\n'); //trim white-spaces
}

function isValidate(target, text) {
    if (target.includes('ENDGAME.GUI')) return true;
    return false;
}

function reloadTapi() {
	exports.units = new archClass('units')
	exports.weapons = new archClass('weapons')
	exports.features = new archClass('features')
	exports.guis = new archClass('guis')
	exports.downloads = new archClass('downloads')
	exports.gamedata = new archClass('gamedata')
}
exports.load = function(name) {
	reloadTapi();
    tapi = pers.load(name);
    if (tapi) {
        tapi = exports.create(tapi, true);
    }
    return tapi;
}
exports.save = function() {
    pers.save(exports.engine.name, exports.engine);
}

function newBuildFolder() {
    makeExist(outputBase + '\\' + exports.engine.name);
    exports.mainOutput = getNewBuildFolder();
    makeExist(exports.mainOutput);
}

function getBuildFolder() {
    return [outputBase, exports.engine.name, exports.engine.version].join('\\');
}
function getNewBuildFolder() {
	let engineBase = [outputBase, exports.engine.name].join('\\');
	let engineCount = (fs.readdirSync(engineBase).length+1).toString();
    return engineBase + '\\' + engineCount;
}

exports.create = function(engine, fromversion = false) {
	console.log('create called', engine)
	if(!fromversion) engine.source = __dirname + '\\' + engine.source
	if(currentBuilds().includes(engine.name)) return 'Error, Name already exists';
	if(engine.name == '') return 'Error, empty name!'
	if(engine.name.includes('.')) return 'Error, name includes .'
	if(engine.name[0] == ' ') return 'Error, name starts with a space'
	let validateMsg = validateEngineSource(engine)
	if(validateMsg) return validateMsg
	if(!(/^(?!\.)(?!com[0-9]$)(?!con$)(?!lpt[0-9]$)(?!nul$)(?!prn$)[^\|\*\?\\:<>/$"]*[^\.\|\*\?\\:<>/$"]+$/.test(engine.name))) return 'Error, name not acceptable, try a filename friendly string' 
	reloadTapi();
    exports.engine = engine;
    if (!fromversion) {
		//NEW VALIDATED ENGINE CREATION
		if(exports.engine.other) { 
			exports.engine.files = {}
			if(exports.engine.other.anims) 
				exports.engine.files.anims = ReadTAFolder(engine.source + '//' + exports.engine.other.anims)
			if(exports.engine.other.bitmaps) 
				exports.engine.files.bitmaps = ReadTAFolder(engine.source + '//' + exports.engine.other.bitmaps)
			if(exports.engine.other.fonts) 
				exports.engine.files.fonts = ReadTAFolder(engine.source + '//' + exports.engine.other.fonts)
			if(exports.engine.other.objects3d) 
				exports.engine.files.objects3d = ReadTAFolder(engine.source + '//' + exports.engine.other.objects3d)
			if(exports.engine.other.scripts) 
				exports.engine.files.scripts = ReadTAFolder(engine.source + '//' + exports.engine.other.scripts)
			if(exports.engine.other.sounds) 
				exports.engine.files.sounds = ReadTAFolder(engine.source + '//' + exports.engine.other.sounds)
			if(exports.engine.other.textures) 
				exports.engine.files.textures = ReadTAFolder(engine.source + '//' + exports.engine.other.textures)
			if(exports.engine.other.unitpics) 
				exports.engine.files.unitpics = ReadTAFolder(engine.source + '//' + exports.engine.other.unitpics)
		}
        exports.init(engine.source);
    } else {
		//LOADING PRE EXISTING VALIDATED ENGINE
        exports.init(getBuildFolder());
    }
    if (typeof engine.version == 'undefined') {
        engine.version = 1;
    }
	if (typeof engine.folders.units != 'undefined') {
		if(engine.folders.units) {
			if(!exports.units.bind(engine.folders.units, true)) return false;
		}
    }
    if (typeof engine.folders.weapons != 'undefined') {
		if(engine.folders.weapons) {
			if(!exports.weapons.bind(engine.folders.weapons, true)) return false;
		}
    }
    if (typeof engine.folders.features != 'undefined') {
		if(engine.folders.features) {
			if(!exports.features.bind(engine.folders.features, true)) return false;
		}
    }
    if (typeof engine.folders.guis != 'undefined') {
		if(engine.folders.guis) {
			if(!exports.guis.bind(engine.folders.guis, true)) return false;
		}
	}
    if (typeof engine.folders.downloads != 'undefined') {
		if(engine.folders.downloads) {
			if(!exports.downloads.bind(engine.folders.downloads, true)) return false;
		}
    }
	if (typeof engine.folders.gamedata != 'undefined') {
		if(engine.folders.gamedata) {
			if(!exports.gamedata.bind(engine.folders.gamedata, true)) return false;
		}
    }
	if(!fromversion) exports.compile(true);
	
    return 'Created!';
}
exports.RESTART_TAPI = function() {
    pers.deleteCache();
    fs.rmSync(__dirname + '\\' + 'builds', {
        recursive: true,
        force: true
    });
    makeExist(__dirname + '\\' + 'builds');
	console.clear()
	process.exit(1);
};
exports.getBuild = function(name, number)
{
	reloadTapi();
	let engine = pers.load(name);
	engine.version = number;
	exports.engine = engine;
	exports.mainOutput = getBuildFolder();
	exports.init(exports.mainOutput);
	if (typeof engine.folders.units != 'undefined') {
		if(engine.folders.units) {
			if(!exports.units.bind(engine.folders.units, true)) return false;
		}
    }
    if (typeof engine.folders.weapons != 'undefined') {
		if(engine.folders.weapons) {
			if(!exports.weapons.bind(engine.folders.weapons, true)) return false;
		}
    }
    if (typeof engine.folders.features != 'undefined') {
		if(engine.folders.features) {
			if(!exports.features.bind(engine.folders.features, true)) return false;
		}
    }
    if (typeof engine.folders.guis != 'undefined') {
		if(engine.folders.guis) {
			if(!exports.guis.bind(engine.folders.guis, true)) return false;
		}
	}
    if (typeof engine.folders.downloads != 'undefined') {
		if(engine.folders.downloads) {
			if(!exports.downloads.bind(engine.folders.downloads, true)) return false;
		}
    }
	  if (typeof engine.folders.gamedata != 'undefined') {
		if(engine.folders.gamedata) {
			if(!exports.gamedata.bind(engine.folders.gamedata, true)) return false;
		}
    }
    return exports;
}
exports.deleteBuild = function(name, number) {
	fs.rmSync([outputBase, name, number].join('\\') , {
		recursive: true,
		force: true
      });
	if(fs.readdirSync(outputBase + '\\' + name).length == 0){
		pers.del(name)
		fs.rmSync([outputBase, name].join('\\') , {
		recursive: true,
		force: true
      });
	}
	return {'msg':'deleted'}
}
exports.commit = function(type, results) {
	try {
		let unitField = makeUnitField(results);
		exports[type].commit(unitField);
	} catch (e) {
		return {'msg' : 'Commit Error', 'error' : e}
	}
	return {'msg' : 'Commited!'}
}
exports.getBuilds = function() 
{
	let JSON = {};
	let engines = fs.readdirSync(outputBase);
	engines.forEach(function(engineName) { 
		let builds = fs.readdirSync(outputBase + '\\' + engineName);
		builds.sort(function(a, b){
			return parseInt(a) < parseInt(b) ? -1 : 1;
		});
		JSON[engineName] = {};
		JSON[engineName].timestamp = pers.load(engineName).timestamp
		JSON[engineName].name = engineName;
		JSON[engineName].builds = builds;
	});
	return JSON;
}

function currentBuilds() {
	return fs.readdirSync(outputBase);
}

function validateEngineSource(engine) {
	if(!fs.existsSync(engine.source)) return 'Invalid Source';
	let atLeastOne = false
	
	if(engine.folders.units) {
		log('validating units');
		atLeastOne++;
		let source = engine.source + '\\' + engine.folders.units;
		if(!fs.existsSync(source)) return 'units not be found';
		let contents = fs.readdirSync(source);
		if(!contents.join(',').toLowerCase().includes(formats.units)) return 'units incorrect type';
	}
	if(engine.folders.weapons) {
		log('validating weapons');
		atLeastOne++;
		let source = engine.source + '\\' + engine.folders.weapons;
		if(!fs.existsSync(source)) return 'weapons not be found';
		let contents = fs.readdirSync(source);
		if(!contents.join(',').toLowerCase().includes(formats.weapons)) return 'weapons incorrect type';
	}
	if(engine.folders.features) {
		log('validating features');
		atLeastOne++;
		let source = engine.source + '\\' + engine.folders.features;
		if(!fs.existsSync(source)) return 'featurtes not found';
		let contents = fs.readdirSync(source);
		if(contents.length > 0 && !contents[0].includes('.')) {
			contents = fs.readdirSync(source+'\\'+contents[0]);
			if(!contents.join(',').toLowerCase().includes(formats.features)) return 'features incorrect type';
		}
	}
	if(engine.folders.guis) {
		log('validating guis');
		atLeastOne++;
		let source = engine.source + '\\' + engine.folders.guis;
		if(!fs.existsSync(source)) return 'guis not found';
		let contents = fs.readdirSync(source);
		if(!contents.join(',').toLowerCase().includes(formats.guis)) return 'guis incorrect type';
	}
	if(engine.folders.downloads) {
		log('validating downloads');
		atLeastOne++;
		let source = engine.source + '\\' + engine.folders.downloads;
		if(!fs.existsSync(source)) return 'downloads not found';
		let contents = fs.readdirSync(source);
		if(!contents.join(',').toLowerCase().includes(formats.downloads)) return 'downloads incorrect type';
	}
	if(engine.folders.gamedata) {
		log('validating gamedata');
		atLeastOne++;
		let source = engine.source + '\\' + engine.folders.gamedata;
		if(!fs.existsSync(source)) return 'gamedata not found';
		let contents = fs.readdirSync(source);
		if(!contents.join(',').toLowerCase().includes(formats.gamedata)) return 'gamedata incorrect type';
	}

	if(engine.other) {
		if(engine.other.anims) {
			log('validating anims')
			let source = engine.source + '\\' + engine.other.anims
			if(!fs.existsSync(source)) return 'anims not found'
		}
		if(engine.other.bitmaps) {
			log('validating bitmaps')
			let source = engine.source + '\\' + engine.other.bitmaps
			if(!fs.existsSync(source)) return 'bitmaps not found'
		}
		if(engine.other.fonts) {
			log('validating fonts')
			let source = engine.source + '\\' + engine.other.fonts
			if(!fs.existsSync(source)) return false
		}
		if(engine.other.objects3d) {
			log('validating objects3d')
			let source = engine.source + '\\' + engine.other.objects3d
			if(!fs.existsSync(source)) return 'objects3d not found'
		}
		if(engine.other.scripts) {
			log('validating scripts')
			let source = engine.source + '\\' + engine.other.scripts
			if(!fs.existsSync(source)) return 'scripts not found'
		}
		if(engine.other.sounds) {
			log('validating sounds')
			let source = engine.source + '\\' + engine.other.sounds
			if(!fs.existsSync(source)) return 'sounds not found'
		}
		if(engine.other.textures) {
			log('validating textures')
			let source = engine.source + '\\' + engine.other.textures
			if(!fs.existsSync(source)) return 'textures not found'
		}
		if(engine.other.unitpics) {
			log('validating unitpics')
			let source = engine.source + '\\' + engine.other.unitpics
			if(!fs.existsSync(source)) return 'unitpics not found'
		}
	}
	
	if(!atLeastOne) return 'Empty create received';
	log('validateEngineSource passed!');
	return '';
} 
function ExplodeGafNames(array, source) {
	let newArray = []
	array.forEach(function(item){
		if(item.toLowerCase().slice(-4) == '.gaf') {
			newArray = [...newArray, ...GetGafNames(source+'\\'+item)]
		} else {
			newArray.push(item)
		}
	})
	return newArray
}
function isASCII(str) {
    return !/[^ -~]+/g.test(str);
}
function GetGafNames(file){
    let end = '\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
    let gaf = fs.readFileSync(file)
    let names = [], ls, le
    
    for(let i = 0, x = 0; i < 1000 && x < 10; i++, x++) {
        le = gaf.lastIndexOf(end)
        ls = le

        let str, primed, c
        for(let n = 0; n < 25 && !str; n++, ls--){
            c = gaf[ls]
            if(!primed && c == 0) le--
            if(c != 0) primed = true
            if(primed && c == 0) str = gaf.slice(ls+1, le+1).toString()
        }
        gaf = gaf.slice(0, ls)
        if(str && isASCII(str)) {
			x = 0
            names.push(str.toLowerCase())
        }
    }
    return names
}
function ReadTAFolder(source) {
	let files = fs.readdirSync(source).map(function(file) { return file.toLowerCase() })
	let parsedFiles = ExplodeGafNames(files, source)
	return parsedFiles
}

