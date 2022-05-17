/* TAPI */
function makeUnitField(cache, excluded = {}, mergeExclude = {}) {
    let tempField = new unitField();
    for (const key in mergeExclude) {
        tempField[key] = (mergeExclude[key]);
    }
    for (const key in cache) {
        if (cache.hasOwnProperty(key)) {
            tempField[key] = (cache[key]);
        }
    };
    for (const key in excluded) {
        tempField._excluded[key] = (excluded[key]);
    }
    return tempField;
}

function advancedTdfSearch(field = '', value = '', tdfObj) {
    for (const key in tdfObj) {
        if (tdfObj.hasOwnProperty(key)) {
            if (key.includes(field) || field == '') {
                if (typeof tdfObj[key] == 'string') {
                    if (tdfObj[key].toLowerCase().includes(value.toLowerCase()) || value == '') {
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
    constructor(type) {
		this.__proto__.__type = type;
        this._excluded = {};
        this.__proto__.__search = function(variable = '', data = '') {
            let newCache = {};
            let excluded = this._excluded;
            for (const key in this) {
                if (this.hasOwnProperty(key) && key != '_excluded') {
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
		this.__proto__.__searchMeta = function(variable = '', data = '') {
			
            let newCache = {};
            let excluded = this._excluded;
            for (const key in this) {
                if (this.hasOwnProperty(key) && key != '_excluded') {
                    let tempObj = this[key];
					let mTag = '__' + variable;
                    if (typeof tempObj[mTag] != 'undefined') {
                        if(tempObj[mTag].toLowerCase().includes(data.toLowerCase())) {
							newCache[key] = tempObj;
							continue;
						}
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
							let value = this[key][vartype][variable];
							if(value.toString() == parseFloat(value)) {
								this[key][vartype][variable] = parseFloat(value);
							}
                            let newValue = ((new Function(variable, func))(this[key][vartype][variable]));
							let changedVar = variable;
							if(vartype!='normal') changedVar = vartype+'.'+changedVar
							let item = page.newPanel(
								`${this[key].__name} ${changedVar} changed from '${this[key][vartype][variable]}' to '${newValue}'`,
								this[key], false
							);
							client.changes.push(item);
                            this[key][vartype][variable] = newValue;
                        } else {
                            console.warn(this[vartype][key][variable], 'error', variable, 'at', key, 'does not exist');
                        }
                    }
                };
            } else {
                console.warn('vartype incorrect');
            }
            return this;
        };
        this.__proto__.__getall = function(vartype, variable) {
            let tempArr = [];
            if (['normal', 'version', 'damage', 'common', 'meta'].includes(vartype)) {
                for (const key in this) {
                    if (this.hasOwnProperty(key) && key != '_excluded') {
						if(vartype == 'meta') {
							if(['name', 'filename', 'gadgetname', 'folder'].includes(variable)) {
								tempArr.push(this[key]['__'+variable]);
							}
						}else {
							if (typeof this[key][vartype][variable] != 'undefined') {
								tempArr.push(this[key][vartype][variable]);
							} else if (false) {
								console.warn(this[vartype][key][variable], 'error', variable, 'at', key, 'does not exist');
							}
						}
                    }
                };
            } else {
                console.warn('vartype incorrect');
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
        this.cache = new unitField();
        this.__proto__.__search = function(term1, term2) {
            return this.cache.__search(term1, term2)
        };
		this.__proto__.__getall = function() { return this.cache.__getall(...arguments); }
		this.commit = function(results) {
			this.cache = makeUnitField(results, {}, results._excluded);
			client.commit(this.archetype, results);
			return true;
		}
    };
}
const tapi = {};
colors = {}
	colors.units = 'blue/red'
	colors.weapons = 'orange'
	colors.features = 'purple'
	colors.guis = 'yellow'
	colors.downloads = 'black'
	colors.gamedata = 'green'
	
tapi.units = new archClass('units')
tapi.weapons = new archClass('weapons')
tapi.features = new archClass('features')
tapi.guis = new archClass('guis')
tapi.downloads = new archClass('downloads')
tapi.gamedata = new archClass('gamedata')
/* END */

var verbose = false;
var xhr;
var debug;
var changes = [];

var page = {}; //page operations

page.get = function(id) { return document.getElementById(id); }

function log() 
{
	if(verbose) {
		debug = Array.prototype.slice.call(arguments);
		let msg = debug.join(' ');
		let term = page.get('terminal');
		let newMsg = document.createElement('span');
		newMsg.innerHTML = `${msg}<br>`;
		term.insertBefore(newMsg, term.firstChild);
	} else {
		console.log(...arguments);
	}
}

function panelSet(what, panel) {
	panel = page.get(panel);
	panel.style.overflowY = 'scroll';
	panel.innerHTML = '';
	if(typeof what == 'string') {
		let newMsg = document.createElement('span');
		newMsg.innerHTML = `${what}<br>`;
		panel.appendChild(newMsg);
	} else {
		try {
			panel.appendChild(what);
		} catch {}
	}
}

function msg() {
	//log(...arguments);
	page.get('message').innerText = Array.from(arguments).join(' ');
}

var forms = {};


var handles = {};
var client = {};

function update(response) {
	msg('Loaded!');
	page.resetSearches();
	if(typeof response == 'string') {
		try { response = JSON.parse(response);
		} catch (error) {
			msg('JSON parse error');
			console.error(error);
		}
	}
	debug = response;
	page.get('engine').className = '';
	client.changes = [];
	page.resetTable();
	tapi.units = new archClass('units');
	tapi.weapons = new archClass('weapons');
	tapi.features = new archClass('features');
	tapi.guis = new archClass('guis');
	tapi.downloads = new archClass('downloads');
	tapi.gamedata = new archClass('gamedata')
	let engine = response;
	
	tapi.engine = engine.engine;
	
	page.get('archetype').innerHTML = '';
	client.archetype = '';
	let firstBuilt;
	
	if(engine.units.built) {
		tapi.units.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "units";
		tapi.units.cache = makeUnitField(engine.units.cache);
		page.get('archetype').innerHTML += '<option value="Units">'+tapi.engine.folders.units+'</option>';
	}
	if(engine.weapons.built) {
		tapi.weapons.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "weapons";
		tapi.weapons.cache = makeUnitField(engine.weapons.cache);
		page.get('archetype').innerHTML += '<option value="Weapons">'+tapi.engine.folders.weapons+'</option>';
	}
	if(engine.features.built) {
		tapi.features.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "features";
		tapi.features.cache = makeUnitField(engine.features.cache);
		page.get('archetype').innerHTML += '<option value="Features">'+tapi.engine.folders.features+'</option>';
	}
	if(engine.guis.built) {
		tapi.guis.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "guis";
		tapi.guis.cache = makeUnitField(engine.guis.cache);
		page.get('archetype').innerHTML += '<option value="Guis">'+tapi.engine.folders.guis+'</option>';
	}
	if(engine.downloads.built) {
		tapi.downloads.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "downloads";
		tapi.downloads.cache = makeUnitField(engine.downloads.cache);
		page.get('archetype').innerHTML += '<option value="Downloads">'+tapi.engine.folders.downloads+'</option>';
	}
	if(engine.gamedata.built) {
		tapi.gamedata.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "gamedata";
		tapi.gamedata.cache = makeUnitField(engine.gamedata.cache);
		page.get('archetype').innerHTML += '<option value="gamedata">'+tapi.engine.folders.gamedata+'</option>';
	}
	client.archetype = firstBuilt;
	page.get('archetype').options[0].selected = true;
	page.get('archetype').onchange();
}

handles.loadBuild = function(response)
{
	msg('Loaded!')
	console.log(response)
	client.loadedBuilds[client.lastBuilt] = response
	page.enableEngineOptions()
	if(skipupdate) {
		skipupdate = false
		panelSet(buildEnginePanel(), 'engineDetails');
		return
	}
	update(response)
	panelSet(buildEnginePanel(), 'engineDetails');
}
client.lastBuilt = [];
client.loadedBuilds = {}
let skipupdate = false
let syncing = false
client.loadBuild = function(name = page.get('engineNames').value, number = page.get('engineIDs').value) 
{
	if(badstate) return msg('Cannot load build, client in badstate')
	panelSet('Syncing...', 'engineDetails')
	page.disableEngineOptions()
	page.get('engine').className = 'disabled';
	msg('Loading...');
	client.changes = [];
	panelSet('', 'panelDL');
	
	network.sendsync('getBuild', [name, number], handles.loadBuild)
	
	if(client.loadedBuilds[[name, number]] != undefined) {
			update(client.loadedBuilds[[name, number]])
			tryLastEdit()
			msg('Loaded!')
			skipupdate = true
	} else {
		panelSet('', 'panelDR')
	}
	
	client.lastBuilt = [name, number];
	

}
client.loadLast = function() {
	if(badstate) return msg('Cannot load last, client in badstate')
	if(syncing) return msg('Cannot load last, client syncing')
	if(client.lastBuilt.length > 1) {
		client.changes = [];
		panelSet('', 'panelDR')
		client.loadBuild(client.lastBuilt [0], client.lastBuilt [1]);
	}
}
handles.deleteBuild = function(response) {
	msg(response.msg)
}
client.deleteBuild = function(name, number) {
	delete client.loadedBuilds[[name, number]]
	network.sendsync('deleteBuild', [name, number], handles.deleteBuild)
}

function tryLastEdit(){
	try {
		let item = tapi[lastEditor[1]].cache[lastEditor[0].__name]
		panelSet(editor(item, lastEditor[1]), 'panelDR');
		
		
	} catch {
		panelSet('','panelDR')
	}
}
client.resetPanels = function() {
	panelSet('', 'editorDetails')
	panelSet('', 'engineDetails');
	panelSet('', 'panelDL')
	panelSet('', 'panelDR')
	tryLastEdit()
	page.get('engine').className = 'disabled'
	client.changes = [];
}
handles.getBuilds = function(builds)
{
	if(JSON.stringify(builds) == '{}') {
		panelSet(buildEngineSelector(builds), 'engineSelector')
		return
	}
	if(JSON.stringify(buildSelector.builds) == JSON.stringify(builds)) return
	panelSet(buildEngineSelector(builds), 'engineSelector')
}

client.getBuilds = function()
{
	network.send('getBuilds', handles.getBuilds)
}

handles.commit = function(results) {
	msg('Results commited!')
}

client.commit = function(type, results) {
	if(badstate) return msg('Cannot commit, client in badstate')
	if(syncing) return msg('Cannot commit, client syncing')
	network.sendsync('commit', [type, results], handles.commit)
}

handles.create = function(response) {
	msg(response.msg)
}

client.create = function(engine){
	page.resetTable()
	network.sendsync('create', [engine], handles.create)
}

handles.compile = function(response) {
	msg(response.msg)
}

client.compile = function() {
	if(badstate) return msg('Cannot compile, client in badstate')
	if(syncing) return msg('Cannot compile, client syncing')
	page.disableEngineOptions()
	panelSet('', 'panelDR');
	msg('Compiling');
	client.resetPanels()
	client.changes = [];
	network.sendsync('compile', handles.compile)
}

handles.RESTART_TAPI = function(response) {
	msg(response.msg)
}

client.RESTART_TAPI = function() {
	let okayed = confirm('Are you sure you want to delete everything?');
	if(!okayed) return;
	network.send('RESTART_TAPI', handles.RESTART_TAPI)
	setTimeout(function(){window.location = '127.0.0.1'},2000);
}



function newEle(type) {
	return document.createElement(type);
}
function makeAskField(entry) {
	let element = newEle('span');
	let input = newEle('input');
	input.placeholder = entry;
	input.id = 'var_'+entry;
	element.appendChild(input);
	return element;
}
function getAskFields() {
	let results = {};
	Array.from(document.querySelectorAll('input[id*=var]')).forEach(function(element) {
		results[element.id.replace('var_','')] = element.value;
	});	
	return results;
}
function destoryAsk(form) {
	try{
		form = page.get('askPanel');
		form.parentNode.removeChild(form);
	} catch {}
}
function ask(form, handler) {
	if(Array.from(document.querySelectorAll('input[id*=var]')).length) { return; }
	let clonedForm = JSON.parse(JSON.stringify(form));
	let askPanel = newEle('div');
	askPanel.style.margin = 'auto';
	askPanel.style.width = '50%';
	askPanel.style.border = '3px solid black';
	askPanel.style.padding = '10px'
	askPanel.id = 'askPanel';
	let entry;
	while( (entry = clonedForm.shift()) ) {
		if(entry.slice(0,2) != '__') {
			askPanel.appendChild(makeAskField(entry));
			askPanel.appendChild(newEle('br'));
		} else {
			let header = document.createElement('h3');
			header.innerText = entry.slice(2);
			askPanel.appendChild(header);
		}
	}
	let finish = newEle('button');
	finish.innerText = 'post';
	finish.onclick = function() {
		handler(getAskFields());
		destoryAsk();
	}
	askPanel.appendChild(finish);
	panelSet(askPanel, 'panelDL');
}
forms.create = 
['__Create a new engine', 'name', 'source',
'__folders', 'units', 'weapons', 'features', 'guis', 'downloads', 'gamedata',
'__other', 'anims', 'bitmaps', 'fonts', 'objects3d', 'scripts', 'sounds', 'textures', 'unitpics'];
handles.createAsk = function (formData) {
	msg('creating...(may take a while!)');
	let folderBinds = ({
		'units':formData.units, 
		'weapons':formData.weapons, 
		'features':formData.features, 
		'guis':formData.guis, 
		'downloads':formData.downloads,
		'gamedata': formData.gamedata
	});
	let others =({
		'anims':formData.anims,
		'bitmaps':formData.bitmaps,
		'fonts':formData.fonts,
		'objects3d':formData.objects3d,
		'scripts':formData.scripts,
		'sounds':formData.sounds,
		'textures':formData.textures,
		'unitpics':formData.unitpics
	})
	let engine = ({	
		'name':(formData.name), 
		'source':(formData.source), 
		'folders':(folderBinds),
		'other':(others)
	});
	client.create(engine);
}

page.createAsk = function() {
	ask(forms.create, handles.createAsk);
}

page.toggle = function (id) {
	let panel = page.get(id);
	panel.className = ((panel.className == 'disabled') ? '' : 'disabled');
}

client.archetype = '';

handles.changeType = function(element) {
	page.resetSearches();
	panelSet('', 'editorDetails')
	client.archetype = element.value.toLowerCase();
	client.results = tapi[client.archetype].__search();
	msg('Found', client.results.__count(), 'results');
	page.constructTable(client.results);
	client.reviewChanges();
}
 
handles.timer = 0;

handles.performSearch = function() {
	let terms = Array.from(arguments);
	if(!tapi[client.archetype].built) msg('Error', client.archetype, 'not built');
	let results;
	if(terms[0])  {
		results = tapi[client.archetype].cache.__searchMeta('name', terms[0]);
	} else {
		results = tapi[client.archetype].cache.__search();
	}		
	if(terms[1]) {
		results = results.__search(terms[1], terms[2]);
	}
	msg('Found', results.__count(), 'results');
	client.results = results;
	page.constructTable(results);
}

handles.searchTerms = ['', '', ''];

handles.search = function(element) {
	if(page.get('engine').className == 'disabled') return;
	if(client.archetype == '') client.archetype = page.get('archetype').value.toLowerCase();
	let term1 = page.get('searchName').value;
	let term2 = page.get('searchVariable').value;
	let term3 = page.get('searchValue').value;
	if(term1 != handles.searchTerms[0] ||
		term2 != handles.searchTerms[1] ||
		term3 != handles.searchTerms[2] 
		) {
		if(handles.timer != 0) {
			clearTimeout(handles.timer);
		}
		handles.searchTerms[0] = term1;
		handles.searchTerms[1] = term2;
		handles.searchTerms[2] = term3;
		handles.timer = setTimeout((function(){handles.performSearch(...handles.searchTerms);}), 250);
	}
}

page.grabItem = function(item, archetype) {
	panelSet(editor(item, archetype), 'panelDR');
}

page.newPanel = function (name, item, floats = true, archetype = 'not set') {
	if(archetype == 'not set') archetype = client.archetype;
	let newItem = newEle(floats ? 'span' : 'div');
	newItem.setAttribute('archetype', archetype)
	let color = colors[archetype];
	if(archetype == 'units') {
		color = item.normal.side == 'ARM' ? color.split('/')[0] : color.split('/')[1]
	}
	newItem.style.border = ('1mm ridge ' + color)
	newItem.meta = item.__name;
	if(floats) newItem.style.float = 'left';
	newItem.className = 'panelItem';
	let clone = (tapi[archetype].cache[item.__name]);
	newItem.onclick = (function(element){
		page.grabItem(clone, element.target.getAttribute('archetype'));
	});
	newItem.innerText = `${name}`;
	return newItem;
}

page.resetTable = function() {
	let panel = page.get('panelDL');
	panel.innerHTML = '';
}

page.constructTable = function(results) {
	let panel = page.get('panelDL');
	panel.innerHTML = '';
	panel.style.display = 'block';
	panel.style.float = 'left';
	panel.style.overflowY = 'scroll';
	let names = results.__getall('meta', 'name');
	names.forEach(function(name) {
		panel.appendChild(page.newPanel(name, results[name]));
	});
}

function generateHeader(text, size = 4) {
	let body = newEle('span');
	let label = newEle(`h${size}`);
	label.innerText = text;
	body.appendChild(label);
	return body;
}

function generateInput(type, name, value, archetype, vartype = false, metaname = false) {
	if(isspecial(name)) return generateSpecialInput(type, name, value, archetype, vartype, metaname)
	let input = newEle('input');
	input.id = `editor.${type}.${name}`;
	input.value = value;
	input.type=archetype;
	input.style.display = "inline-block";
	input.style.width = "60%";
	let label = newEle('span');
	label.innerText = name;
	label.style.display = "inline-block";
	label.style.width = "35%";
	
	if(vartype && metaname) {
		let delBtn = newEle('button')
		delBtn.innerText = 'delete'
		delBtn.onclick = function(){
			deleteOne(metaname, vartype, name)
		}
		label.appendChild(delBtn)
	}
	
	let combined = newEle('div');
	combined.style.width="100%";
	combined.appendChild(label);
	combined.appendChild(input);
	return combined;
}

client.changes = [];
lastEditor = []
client.editorSave = function() {
	if(badstate) return msg('Cannot save, client in badstate')
	if(syncing) return msg('Cannot save, client syncing')
	let valMsg = validateEditorSave();
	if(valMsg && !confirm(valMsg)) return
	let inputs = Array.from(document.querySelectorAll('input[id*=editor]'));
	inputs.forEach(function(input){
		let id = input.id;
		let vartype = id.split('.')[1];
		let varname = id.split('.')[2];
		let type = input.getAttribute('type');
		console.log(5, type)
		let value = input.value;
		if(vartype == 'meta') {
			if(tapi[type].cache[client.workingItem]['__'+varname] != value) {	
			let item = page.newPanel(
					`${tapi[type].cache[client.workingItem].__name} ${vartype}.${varname} changed from '${tapi[type].cache[client.workingItem]['__'+varname]}' to '${value}'`,
					(tapi[type].cache[client.workingItem]), false, type
					);
				client.changes.push(item);
				tapi[type].cache[client.workingItem]['__'+varname]=value;
			}
		} else {
			if(tapi[type].cache[client.workingItem][vartype][varname] != value) {
				let changedVar = varname;
				if(vartype!='normal') changedVar = vartype+'.'+changedVar
				let item = page.newPanel(`${tapi[type].cache[client.workingItem].__name} ${changedVar} changed from '${tapi[type].cache[client.workingItem][vartype][varname]}' to '${value}'`,
					(tapi[type].cache[client.workingItem]), false, type
					);
				client.changes.push(item);
				tapi[type].cache[client.workingItem][vartype][varname]=value;
			}
		}
	});
	tapi[client.archetype].commit(tapi[client.archetype].cache);
	msg('Saved!');
	client.reviewChanges();
}

client.workingItem = '';

function newInput(type){
	let tap = tapi[lastEditor[1]].cache[client.workingItem]
	let body = newEle('span')
	
	let input1 = newEle('input'), input2 = newEle('input')
	input1.id='newInput.'+type, input2.id='newInput.'+type
	input1.style.width='25%', input2.style.width='25%'
	let btn = newEle('button')
	btn.innerText = 'Add'
	btn.onclick = function(){
		let ins = document.querySelectorAll('[id*="newInput.'+type+'"]')
		let varname = ins[0].value
		let vardata = ins[1].value
		if(tap[varname]) {
			alert(varname + ' already exists as ' + tap[varname])
			return
		}
		tap[type][varname] = vardata
		let item = page.newPanel(`${tap.__name} created '${varname}' as '${vardata}'`,
			tap, false, lastEditor[1]
		);
		client.changes.push(item);
		client.reviewChanges()
	}
	body.appendChild(input1)
	body.appendChild(input2)
	body.appendChild(btn)
	return body
}
function editorColouring(archetype, item) {
	let col = colors[archetype]
	if(archetype == 'units') {
		let side = item.normal.side.toLowerCase() == 'arm' ? 0 : 1
		col = col.split('/')[side]
	}
	let panelDR = document.getElementById('panelDR')
	panelDR.style.background = col
	let newCol = getComputedStyle(panelDR).background.replace('rgb(','').split(')')[0]
	panelDR.style.background = `rgba(${newCol}, 0.2)`
}
function editor(item, archetype) {
	editorArchetype = archetype
	panelSet(editorMenus[archetype](), 'editorDetails')
	client.workingItem = item.__name
	item = (tapi[archetype].cache[client.workingItem])
	lastEditor = [item, archetype]
	let body = newEle('div');
	body.style.width="100%";
	body.appendChild(generateHeader(item.__name));
	
	let btnRow = newEle('span');
	
	let saveBtn = newEle('button');
	saveBtn.innerText = 'Commit';
	saveBtn.onclick = function() {
		client.editorSave();
	}
	
	let exitBtn = newEle('button');
	exitBtn.innerText = 'Back';
	exitBtn.onclick = function() {
		client.reviewChanges();
	}
	
	btnRow.appendChild(saveBtn);
	btnRow.appendChild(exitBtn);
	body.appendChild(btnRow);
	
	body.appendChild(generateHeader('Meta data'));
	
	((archetype == 'features') ? ['name', 'gadgetname', 'filename', 'folder'] : ['name', 'gadgetname', 'filename']).forEach(function(meta) {
		body.appendChild(generateInput('meta', meta, item['__'+meta], archetype));
	});
	
	if(Object.keys(item.normal).length > 0) {
		
		body.appendChild(generateHeader('normal'));
		
		Object.keys(item.normal).forEach(function(key) {
			body.appendChild(generateInput('normal', key, item.normal[key], archetype, 'normal', item.__name));
		});
		
		body.appendChild(newInput('normal'))
	}
	
	if(Object.keys(item.common).length > 0) {
	
		body.appendChild(generateHeader('common'));
		
		Object.keys(item.common).forEach(function(key) {
			body.appendChild(generateInput('common', key, item.common[key], archetype, 'common', item.__name));
		});
		
		body.appendChild(newInput('common'))
	}
	
	if(Object.keys(item.version).length > 0) {
	
		body.appendChild(generateHeader('version'));
		
		Object.keys(item.version).forEach(function(key) {
			body.appendChild(generateInput('version', key, item.version[key], archetype, 'version', item.__name));
		});
		
		body.appendChild(newInput('version'))
	}
	
	if(Object.keys(item.damage).length > 0) {
	
		body.appendChild(generateHeader('damage'));
		
		Object.keys(item.damage).forEach(function(key) {
			body.appendChild(generateInput('damage', key, item.damage[key], archetype, 'damage', item.__name));
		});
		
		body.appendChild(newInput('damage'))
	}
	
	for(let i = 0; i < 3; i++) {
		body.appendChild(newEle('br'))
	}
	
	setTimeout(function(){
		Array.from(document.querySelectorAll('[special]')).forEach(function(element) {
			element.onchange(element)
	})}, 100)
	setTimeout(function() {
		editorColouring(archetype, item)
	}, 100)
	
	return body;	
	
}

client.reviewChanges = function() {
	if(client.lastBuilt.length == 0) return
	let body = newEle('div');
	body.style.width="100%";
	
	body.appendChild(generateHeader('Changes'));
	
	let saveButton = newEle('button');
	saveButton.innerText = 'Compile';
	saveButton.onclick = function() {
		client.compile();
	}
	body.appendChild(saveButton);
	
	[...client.changes].reverse().forEach(function(change) {
		let div = newEle('div');
		div.appendChild(change);
		body.appendChild(div);
	});
	
	panelSet(body, 'panelDR');
}

client.uid64 = function() {
	return ''+(Math.floor(Math.random() * 10**16))+(Math.floor(Math.random() * 10**16))+(Math.floor(Math.random() * 10**16))+(Math.floor(Math.random() * 10**16));
}

client.uniqueID = client.uid64();


client.initialized = false;

page.disableEngineOptions = function() {
	try {
		page.get('engineIDs').disabled = true;
		page.get('engineNames').disabled = true;
	} catch {}
}

page.enableEngineOptions = function() {
	try {
		page.get('engineIDs').disabled = false;
		page.get('engineNames').disabled = false;
	} catch {}
}

client.initialize = function() {
	log("Welcome to the tapi client testing facility!");
	log("source: hpi_out");
	log("folders in hpi_out: units, weapons, features, guis, downloads");
	log("F12 for console, tapi (for tapi.units.__search etc), client.results (for search results)");
	setInterval(handles.search, 50);
	setInterval(client.getBuilds, 1000)
	client.initialized = true;
	page.resetSearches();
}

page.resetSearches = function() {
	page.get('searchName').value = '';
	page.get('searchValue').value = '';
	page.get('searchVariable').value = '';
	handles.searchTerms = ['', '', ''];
}

var buildSelector = {builds : {}}
buildSelector.name = '';

function buildEngineSelector(builds) {
	if(builds.status == 'BAD') return
	if(JSON.stringify(builds) == JSON.stringify({})) return 'No builds, click New engine'
	client.resetPanels()
	buildSelector.builds = builds
	
	let latestEngine = {timestamp : 0};
	let latestVersion;
	
	Object.keys(buildSelector.builds).forEach(function(engineName) {
		if(buildSelector.builds[engineName].timestamp > latestEngine.timestamp)
			latestEngine = buildSelector.builds[engineName]
			latestVersion = latestEngine.builds.slice(-1)[0] 
	})
	
	
	if(latestVersion && JSON.stringify(latestEngine) != JSON.stringify({timestamp : 0})) {
			client.loadBuild(latestEngine.name, latestEngine.builds.slice(-1)[0])
	}
	
	let body = newEle('div')

	let engineNames = newEle('select')
	engineNames.id = 'engineNames'
	engineNames.disabled = true
	engineNames.onchange = function(){
		buildSelector.name = this.value
		panelSet('', 'engineIDs')
		let wrapper = newEle('optgroup')
		wrapper.setAttribute('label', 'version')
		builds[this.value].builds.forEach(function(version) {
			let option = newEle('option')
			option.value = version
			option.innerText = version
			if(version == latestVersion)
				option.setAttribute('selected', 'selected')
			wrapper.appendChild(option)
		})
		panelSet(wrapper, 'engineIDs')
		page.get('engineIDs').selectedIndex = page.get('engineIDs').childNodes[0].lastChild.index
		client.loadBuild()
	}
	
	let engineVers = newEle('select')
	engineVers.id='engineIDs'
	engineVers.disabled = true
	let idwrapper = newEle('optgroup')
	idwrapper.setAttribute('label', 'version')
	latestEngine.builds.forEach(function(version) {
		let option = newEle('option')
		option.value = version
		option.innerText = version
		if(version == latestVersion)
			option.setAttribute('selected', 'selected')
		idwrapper.appendChild(option)
	})
	engineVers.appendChild(idwrapper)
	
	
	engineVers.onchange = function() {
		client.loadBuild()
	}
		
	let outGroups = []
	let outGroupEles = {}
	
	Object.keys(builds).forEach(function(name) {
		
		let groupName, finalName
		if(name.split(' ').length > 1) {
			groupName = name.split(' ')[0]
			finalName = name.split(' ').slice(1).join(' ')
			if(!outGroups.includes(groupName)){
				outGroups.push(groupName)
				outGroupEles[groupName] = newEle('optgroup')
				outGroupEles[groupName].setAttribute('label', groupName)
			}

		}
		let newEName = newEle('option')
		newEName.value = name
		newEName.innerText = name
		if(name == latestEngine.name)
			newEName.setAttribute('selected', 'selected')
		
		if(groupName)
			outGroupEles[groupName].appendChild(newEName)
		else
			engineNames.appendChild(newEName)
	});
	
	outGroups.forEach(function(optg) {
		engineNames.appendChild(outGroupEles[optg])
	})
	
	body.appendChild(engineNames)
	body.appendChild(engineVers)
	
	return body
}

function buildEnginePanel(){
	if(lastEditor.length>1) {
		tryLastEdit()
	} else {
		client.reviewChanges()
	}
	let body = newEle('span');
	body.appendChild(generateHeader(tapi.engine.name + ', version ' + tapi.engine.version, 6));
	if(page.get('engineNames').value != tapi.engine.name) page.get('engineNames').value = tapi.engine.name 
	if(page.get('engineIDs').value != tapi.engine.version) page.get('engineIDs').value = tapi.engine.version
	let delBtn = newEle('button');
	delBtn.onclick = function() { 
		msg('Deleting...')
		page.disableEngineOptions()
		client.resetPanels()
		client.deleteBuild(tapi.engine.name, tapi.engine.version);
	};
	delBtn.innerText = 'DELETE';
	body.appendChild(delBtn);
	return body;
}

client.foreach = function() {
	let vt = page.get('foreachVartype').value;
	let v = page.get('foreachVar').value;
	let f = page.get('foreachFunc').value;
	try {
		tapi[client.archetype].commit(
			client.results.__foreach(vt, v, f)
		);
	} catch (error){
		console.warn(error);
		msg('foreach Error');
	}
	client.reviewChanges();
}

client.searchAppends = [];

client.searchAppend = function () {
	tapi[client.archetype].cache = client.results
	let n = page.get('searchName').value
	n = (n != '') ? ('name has "' + page.get('searchName').value + '" ') : ''
	let v = page.get('searchVariable').value
	v = (v != '') ? ('var has "' + page.get('searchVariable').value + '" ') : ''
	let va = page.get('searchValue').value
	va = (va != '') ? ('value has "' + page.get('searchValue').value + '"') : ''
	client.searchAppends.push(
		n + v + va
	);
	
	let body = newEle('div')
	
	client.searchAppends.forEach(function(append) {
		let label = newEle('div')
		label.innerText = append
		body.appendChild(label)
	})
	
	panelSet(body, 'searchDetails')
	page.resetSearches()
}

client.searchAppRes = function () {
	tapi[client.archetype].cache = makeUnitField(client.results, {}, client.results._excluded);
	handles.changeType(page.get('archetype'));
	client.searchAppends = [];
	panelSet('', 'searchDetails');
}

window.onload = function() {
	client.initialize();
}

/* NETOWRK */
let network;
let badstate = false
let badResponseMsg = 'Client already open somewhere, waiting...'

if(axios){
	axios.defaults.baseURL = ''
	network = createNetwork()
	network.errorHandler = function(res) {
		network.ready = true
		msg('Unknown Error f12 for details')
		console.warn('Unknown Error', res)
	}
	network.goodping = function(res){
		badstate = false
		if(page.get('message').innerText == badResponseMsg)
			msg('Client online')
	}
	network.badping = function(res){
		badstate = true
		msg(badResponseMsg)
	}
	
	network.syncon = function(){
		syncing = true
		console.log('-------------')
		console.log('SYNC STARTED!')
		console.log('-------------')
		page.get("panelDL").style.backgroundColor = "rgb(155, 155, 155)"
		page.get("panelDR").style.backgroundColor = "rgb(155, 155, 155)"
	}
	
	network.syncoff = function(){
		syncing = false
		console.log('-------------')
		console.log('SYNC STOPPED!')
		console.log('-------------')
		page.get("panelDL").style.backgroundColor = "rgb(204, 221, 255)" 
		page.get("panelDR").style.backgroundColor = "rgb(255, 204, 204)" 
	}
	
	network.ping()
	setInterval(network.ping, 500)
}


/* EDITOR PANELS */
let editorArchetype = ''
let editorMenus = {};

editorMenus.header = function(){
	let body = newEle('div');
	
	let inp = newEle('input')
	inp.id='editInp'
		
	let select = newEle('select')
	select.id = 'editSelect';
		
	(['normal', 'version', 'common', 'damage']).forEach(function(selty) {
		let selopt = newEle('option')
		selopt.value = selty
		selopt.innerText = selty
		select.appendChild(selopt)
	})

	let btn = newEle('button')
	btn.innerText = 'Delete all'
	btn.onclick = function(){
		if(document.querySelector('#editInp').value == '') return
		deleteAll(document.querySelector('#editSelect').value, document.querySelector('#editInp').value)
	}
	
	let btn2 = newEle('button')
	btn2.innerText = 'Get all'
	btn2.onclick = function(){
		if(document.querySelector('#editInp').value == '') return
		getAll(document.querySelector('#editSelect').value, document.querySelector('#editInp').value)
	}
	
	body.appendChild(inp)
	body.appendChild(select)
	body.appendChild(btn)
	body.appendChild(btn2)
	return body
}


editorMenus.units = function(){
	let body = newEle('div')
	body.appendChild(editorMenus.header())
	return body
};

editorMenus.weapons = function(){
	let body = newEle('div')
	body.appendChild(editorMenus.header())
	let idBtn = newEle('button')
	idBtn.innerText = 'Find free weapon ID'
	idBtn.onclick = function(){
		let fids = []
		let ids = tapi.weapons.cache.__getall('normal', 'id')
		for(let i = 0; i<252; i++) {
			if(!ids.includes(i)) {
				fids.push(i)
			}
		}
		alert(`${fids.length} total free IDs\n\n${fids.join(', ')}`)
	}
	
	body.appendChild(idBtn)
	
	return body
};

editorMenus.features = function(){
	let body = newEle('div')
	body.appendChild(editorMenus.header())
	return body
};

editorMenus.guis = function(){
	let body = newEle('div')
	body.appendChild(editorMenus.header())
	return body
};

editorMenus.downloads = function(){
	let body = newEle('div')
	body.appendChild(editorMenus.header())
	return body
};

editorMenus.gamedata = function(){
	let body = newEle('div')
	body.appendChild(editorMenus.header())
	return body
};

/* ADVANCED EDITOR FUNCTIONS */
function deleteOne(name, vartype, varname){
	if(confirm(`CONFIRM DELETION OF ${name} ${varname}'`)) {
		let item = page.newPanel(
			`${name} ${varname} DELETED`,
			tapi[editorArchetype].cache[name], false
		);
		client.changes.push(item);
		delete tapi[editorArchetype].cache[name][vartype][varname]
		tapi[editorArchetype].commit(tapi[editorArchetype].cache)
		client.reviewChanges()
	}
}

function deleteAll(vartype, varname){
	let count = 0
	Object.keys(tapi[lastEditor[1]].cache).forEach(function(name){
		if(name == '_excluded') return
		if(!tapi[lastEditor[1]].cache[name]) return
		count++
	})
	if(count <= 0) {
		alert('None found')
		return
	}
	if(confirm(`Are you sure you want to delete ${varname} from ${count} items?`)) {
		Object.keys(tapi[lastEditor[1]].cache).forEach(function(name){
			if(name == '_excluded') return
			if(!tapi[lastEditor[1]].cache[name]) return
			let item = page.newPanel(
				`${name} ${varname} DELETED'`,
				tapi[lastEditor[1]].cache[name], false
			);
			client.changes.push(item);
			delete tapi[lastEditor[1]].cache[name][vartype][varname]
		})
	}
	client.reviewChanges()
}

function getAll(vartype, varname) {
	let results = tapi[lastEditor[1]].cache.__getall(vartype, varname).join(', ')
	alert(`all ${varname}'s in ${lastEditor[1]} \n\n${results}`)
}

let vc = {}
vc.green = 'rgba(0, 255, 0, 0.5)'
vc.yellow = 'rgba(255, 255, 0, 0.5)'
vc.red = 'rgba(255, 0, 0, 0.5)'
//'rgba(255, 255, 0, 0.5)' = green
//'rgba(0, 255, 0, 0.5)' = yellow

let specVal = {}, valFile = {}
function valWeapScript(str) {
	str = str.toLowerCase()
	let scripts = tapi.engine.files.scripts
	if(!scripts) return vc.yellow
	if(scripts.includes(str)) return vc.green
	return vc.red
}
function valWeapName(str) {
	if(!tapi.weapons.built) return vc.yellow
	if(tapi.weapons.cache[str]) return vc.green
	return vc.red
}
valFile.sounds = function(str) {
	str = str.toLowerCase()
	let snds = tapi.engine.files.sounds
	if(!snds) return vc.yellow
	if(snds.includes(str+'.wav')) return vc.green
	return vc.red
}
valFile.objects3d = function (str) {
	str = str.toLowerCase()
	from = tapi.engine.files.objects3d
	if(!from) return vc.yellow
	if(from.includes(str+'.3do')) return vc.green
	return vc.red
}
valFile.anims = function(str) {
	str = str.toLowerCase()
	from = tapi.engine.files.anims
	if(!from) return vc.yellow
	if(from.includes(str)) return vc.green
	return vc.red
}
function valSide(str) {
	if(['ARM', 'CORE'].includes(str.toUpperCase())) return vc.green
	return vc.red
}
function valGameData(value) {
	if(Object.keys(tapi.gamedata.cache.__searchMeta('name', value)).length > 1) return vc.green
	return vc.red
}
function valFeatures(value) {
	if(Object.keys(tapi.features.cache.__searchMeta('name', value)).length > 1) return vc.green
	return vc.red
}
function valId(id, element) {
	id = parseInt(id)
	let old = parseInt(element.getAttribute('old'))
	let ids = tapi[lastEditor[1]].cache.__getall('normal', 'id')
	ids[ids.indexOf(old)] = undefined
	if(ids.includes(id)) return vc.red
	return vc.green
}
//Validate functions validate if a certain value is completely fine (green), or bad/conflicting (red)
//valFile.[folder] checks if the file exists for the entry, like a sound.wav
specVal.side = valSide //lol
specVal.id = valId

specVal.weapon1 = valWeapName
specVal.weapon2 = valWeapName
specVal.weapon3 = valWeapName

specVal.explodeas = valWeapName
specVal.selfdestructas = valWeapName

specVal.explosionart = valFile.anims
specVal.waterexplosionart = valFile.anims
specVal.lavaexplosionart = valFile.anims
specVal.objectname = valFile.objects3d

specVal.soundcategory = valGameData
specVal.movementclass = valGameData //Movement class overrides FBI movement tags

specVal.soundstart = valFile.sounds
specVal.soundhit = valFile.sounds
specVal.soundtrigger = valFile.sounds
specVal.sound = valFile.sounds


specVal.corpse = valFeatures //FEATURES AREN'T EVEN BUILT CORRECTLY IDIOT x'D

//specVal.movementclass = ?

//specVal.defaultmissiontype = ?
//specVal.wpri_badtargetcategory =?

let specials = Object.keys(specVal);
function isspecial(name){
	return specials.includes(name)
}


function generateSpecialInput(type, name, value, archetype, vartype = false, metaname = false) {
	let input = newEle('input');
	input.setAttribute('old', value)
	input.setAttribute('special', 'true')
	input.setAttribute('name', name)
	input.onchange = function(element) {
		if(element.target) {
			element.target.style.background = specVal[element.target.getAttribute('name')](element.target.value, element.target)
			return
		}
		element.style.background = specVal[element.getAttribute('name')](element.value, element)
	}
	input.id = `editor.${type}.${name}`;
	input.value = value;
	input.type=archetype;
	input.style.display = "inline-block";
	input.style.width = "60%";
	let label = newEle('span');
	label.innerText = name;
	label.style.display = "inline-block";
	label.style.width = "35%";
	
	if(vartype && metaname) {
		let delBtn = newEle('button')
		delBtn.innerText = 'delete'
		delBtn.onclick = function(){
			deleteOne(metaname, vartype, name)
		}
		label.appendChild(delBtn)
	}
	
	let combined = newEle('div');
	combined.style.width="100%";
	combined.appendChild(label);
	combined.appendChild(input);
	return combined;
}

function fastEdits() {
	Array.from(document.querySelectorAll('[special]')).forEach(function(element) {
		element.onchange(element)
	});
}; setInterval(fastEdits, 250);

function validateEditorSave() {
	let reds = '', yellows = ''
	Array.from(document.querySelectorAll('[special]')).forEach(function(element) {
		if(element.style.background == (vc.red+' none repeat scroll 0% 0%')) reds += (element.getAttribute('name') + ' = "' + element.value + '"\n')
	});
	Array.from(document.querySelectorAll('[special]')).forEach(function(element) {
		if(element.style.background == (vc.yellow+' none repeat scroll 0% 0%')) yellows += (element.getAttribute('name') + ' = "' + element.value + '"\n')
	});
	
	if(reds) reds = ('Major errors\n\n' + reds + '\n\n')
	if(yellows) yellows = ('Unable to verify due to missing information\n\n' + yellows + '\n\n')
	
	let confirmMsg = 'Are you sure you want to save?'
	
	if(reds || yellows) return reds+yellows+confirmMsg

	return ''
}

function BuildFromPreset() {
	if(badstate) { msg('wait until synced!'); return}
	alert('this pre-builds from an OTA hpi_in export, make sure you have dumped OTA hpi to hpi_in')
	document.querySelectorAll('button')[0].click();i=['OTA FULL','hpi_in','units','weapons','features','guis','download','gamedata','anims','bitmaps','fonts','objects3d','scripts','sounds','textures','unitpics'];Array.from(document.querySelectorAll('[id*=var]')).forEach(function(e){e.value=i.shift()});Array.from(document.querySelectorAll('button')).forEach(function(b){if(b.innerText=='post') b.click()});
}

/* create auto complete

document.querySelectorAll('button')[0].click();i=['OTA FULL','hpi_in','units','weapons','features','guis','download','gamedata','anims','bitmaps','fonts','objects3d','scripts','sounds','textures','unitpics'];Array.from(document.querySelectorAll('[id*=var]')).forEach(function(e){e.value=i.shift()});document.querySelectorAll('button')[7].click()

*/