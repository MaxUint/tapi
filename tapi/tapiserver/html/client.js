/* TAPI */


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
        tempField.__proto__.__excluded[key] = excluded[key];
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
        this.__proto__.__excluded = {};
        this.__proto__.__search = function(variable = '', data = '') {
            let newCache = {};
            let excluded = this.__excluded;
            for (const key in this) {
                if (this.hasOwnProperty(key)) {
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
            let excluded = this.__excluded;
            for (const key in this) {
                if (this.hasOwnProperty(key)) {
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
                    if (this.hasOwnProperty(key)) {
                        if (typeof this[key][vartype][variable] != 'undefined') {
                            let newValue = ((new Function(variable, func))(this[key][vartype][variable]));
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
                    if (this.hasOwnProperty(key)) {
						if(vartype == 'meta') {
							if(['name', 'filename', 'gadgetname', 'folder'].includes(variable)) {
								tempArr.push(this[key]['__'+variable]);
							}
						}else {
							if (typeof this[key][vartype][variable] != 'undefined') {
								tempArr.push(this[key][vartype][variable]);
							} else if (exports.verbose) {
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
                return (Object.keys(this.__excluded).length);
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
		
    };
	commit(results) {
        this.cache = makeUnitField(results, {}, results.__excluded);
		client.commit(this.archetype, results);
        return true;
    };
}
const tapi = {};
tapi.units = new archClass('units');
tapi.weapons = new archClass('weapons');
tapi.features = new archClass('features');
tapi.guis = new archClass('guis');
tapi.downloads = new archClass('downloads');
/* END */

var verbose = true;
var xhr;
var debug;

var page = {}; //page operations

page.get = function(id) { return document.getElementById(id); }

function log() 
{
	debug = Array.prototype.slice.call(arguments);
	let msg = debug.join(' ');
	if(verbose) {
		let term = page.get('terminal');
		let newMsg = document.createElement('span');
		newMsg.innerHTML = `${msg}<br>`;
		term.insertBefore(newMsg, term.firstChild);
	} 
}

function panelSet(what, panel) {
	panel = page.get(panel);
	panel.style.overflow = 'scroll';
	panel.innerHTML = '';
	if(typeof what == 'string') {
		let newMsg = document.createElement('span');
		newMsg.innerHTML = `${what}<br>`;
		panel.appendChild(newMsg);
	} else {
		panel.appendChild(what);
	}
}

function msg() {
	log(...arguments);
	page.get('message').innerText = Array.from(arguments).join(' ');
}

function pipeCreate(request, handler) {
	request.args = JSON.stringify(request.args);
	let pool = {};
	let poolSize = 0;
	let maxSend = 4096;
	
	while(request.args.length > 0)
	{
		pool[poolSize] = request.args.slice(0, maxSend);
		if(request.args.length >= maxSend) {
			request.args = request.args.slice(maxSend);
		} else {
			request.args = '';
		}
		poolSize++;
	}

	request.poolSize = poolSize;

	for(let i = 0; i < poolSize; i++) {
		request.poolNumber =  i;
		request.args = pool[i];
		pipeSend(request, handler);
	}
}

function pipeSend(request, handler) {
	log('sending pool ' + request.poolNumber +': '+ request.args, 'to', request.func);
	request = JSON.stringify(request);
	xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function()
	{
		if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != '')
		{
			pipe(JSON.parse(xhr.responseText), handler);
		}
	};
	xhr.open("POST", '127.0.0.1', true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(request);
}

var pipeCalls = [], pipeData = [];
var handles = {};


function pipe(data, handler) 
{
	pipeData.push(data);
	pipeCalls.push(handler);
	pipeProc();
}

function pipeProc() 
{
	console.log(pipeData,pipeCalls);
	pipeCalls.shift()(pipeData.shift());
}

client = {};

function update(response) {
	page.get('engine').className = '';
	page.resetTable();
	tapi.units = new archClass('units');
	tapi.weapons = new archClass('weapons');
	tapi.features = new archClass('features');
	tapi.guis = new archClass('guis');
	tapi.downloads = new archClass('downloads');
	let engine = response;
	
	tapi.engine = engine.engine;
	
	page.get('archetype').innerHTML = '';
	client.archetype = '';
	let firstBuilt;
	
	if(engine.units.built) {
		tapi.units.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "units";
		tapi.units.cache = makeUnitField(engine.units.cache);
		page.get('archetype').innerHTML += '<option value="Units">Units</option>';
	}
	if(engine.weapons.built) {
		tapi.weapons.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "weapons";
		tapi.weapons.cache = makeUnitField(engine.weapons.cache);
		page.get('archetype').innerHTML += '<option value="Weapons">Weapons</option>';
	}
	if(engine.features.built) {
		tapi.features.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "features";
		tapi.features.cache = makeUnitField(engine.features.cache);
		page.get('archetype').innerHTML += '<option value="Features">Features</option>';
	}
	if(engine.guis.built) {
		tapi.guis.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "guis";
		tapi.guis.cache = makeUnitField(engine.guis.cache);
		page.get('archetype').innerHTML += '<option value="Guis">Guis</option>';
	}
	if(engine.downloads.built) {
		tapi.downloads.built = true;
		firstBuilt = firstBuilt ? firstBuilt : "downloads";
		tapi.downloads.cache = makeUnitField(engine.downloads.cache);
		page.get('archetype').innerHTML += '<option value="Downloads">Downloads</option>';
	}
	client.archetype = firstBuilt;
	page.get('archetype').options[0].selected = true;
	page.get('archetype').onchange();
}

handles.loadBuild = function(response)
{
	if(response)
	{
		msg('Loaded!');
	} else
	{
		msg('Error, engine not found!');
		return;
	}
	
	update(response);
	
}

client.loadBuild = function(name, number) 
{
	page.get('engine').className = 'disabled';
	msg('Loading...');
	pipeCreate(
		({func:'getBuild', args:
			([
				name,
				number
			])
		}),
		handles.loadBuild
	);
}

handles.getBuilds = function(builds)
{
	log('Received', builds, JSON.stringify(builds));
	
	let buildsPanel = page.get('builds');
	buildsPanel.innerHTML = '';
	function makeLoadBuildBtn(name, number) {
		let loadBuildBtn = document.createElement('button');
		loadBuildBtn.innerText = number.toString();
		loadBuildBtn.onclick = (function () {
			console.log(name, number);
			client.loadBuild(name, number);
		});
		return loadBuildBtn;
	}
	
	for(build in builds) { if(builds.hasOwnProperty(build)) {
		let buildPanel = document.createElement('div');
		let buildName = document.createElement('span');
		buildName.innerText = build.toString();
		buildPanel.appendChild(buildName);
		// lol buildy builder building builds bob the build builder buildings build builders
		builds[build].builds.forEach(function(number) {
			buildPanel.appendChild(makeLoadBuildBtn(build, number));
		});
		page.get('builds').appendChild(buildPanel);
	}};
}

client.getBuilds = function()
{
	pipeCreate(
		({func:'getBuilds', args:
			([])
		}),
		handles.getBuilds
	);
}

handles.commit = function(results) {
	if(results != '')
		log(results);
}

client.commit = function(type, results) {
	pipeCreate(
		({func:'commit', args:
			([type, results])
		}),
		handles.commit
	);
}

handles.create = function(response) {
	if(response) {
		update(response);
		client.getBuilds();
		msg('created successfully!');
	} else {
		msg('creation error!')
	}
	
}

client.create = function(engine){
	page.get('engine').className = 'disabled';
	page.resetTable();
	pipeCreate(
		({func:'create', args:
			([engine])
		}),
		handles.create
	);
}

client.compile = function() {
	pipeCreate(
		({func:'compile', args:
			([])
		}),
		handles.compile
	);
	client.getBuilds();
}

handles.RESTART_TAPI = function(response) {
	msg('restarted');
	location.reload();
}

client.RESTART_TAPI = function() {
	let okayed = confirm('Are you sure you want to delete everything?');
	if(!okayed) return;
	page.resetTable();
	page.get('engine').className = 'disabled';
	pipeCreate(
		({func:'RESTART_TAPI', args:
			([])
		}),
		handles.RESTART_TAPI
	);
	client.getBuilds();
}

forms = {};

forms.create = ['__Create a new engine', 'name', 'source','__folders', 'units', 'weapons', 'features', 'guis', 'downloads'];

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
	form = page.get('askPanel');
	form.parentNode.removeChild(form);
}
function ask(form, handler) {
	if(Array.from(document.querySelectorAll('input[id*=var]')).length) { return; }
	page.get('engine').className = 'disabled';
	let clonedForm = JSON.parse(JSON.stringify(form));
	let askPanel = newEle('div');
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
	page.get('panel3').appendChild(askPanel);
}

handles.createAsk = function (formData) {
	msg('creating...', waiting = true);
	let folderBinds = ({
		units:formData.units, 
		weapons:formData.weapons, 
		features:formData.features, 
		guis:formData.guis, 
		downloads:formData.downloads
	});
	let engine = ({	
		name:(formData.name), 
		source:(formData.source), 
		folders:(folderBinds)
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
	client.archetype = element.value.toLowerCase();
	client.results = tapi[client.archetype].__search();
	msg('Found', client.results.__count(), 'results');
	page.constructTable(client.results);
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

page.grabItem = function(item) {
	panelSet(editor(item), 'panel2');
}

page.newPanel = function (name, item) {
	let newItem = newEle('span');
	newItem.meta = name;
	newItem.style.float = 'left';
	newItem.className = 'panelItem';
	newItem.onclick = (function(){
		let meta = arguments[0].target.meta;
		page.grabItem(tapi[client.archetype].cache[meta]);
	});
	newItem.innerText = `${name}`;
	return newItem;
}

page.resetTable = function() {
	let panel = page.get('panel1');
	panel.innerHTML = '';
}

page.constructTable = function(results) {
	let panel = page.get('panel1');
	panel.innerHTML = '';
	panel.style.display = 'block';
	panel.style.float = 'left';
	panel.style.overflow = 'scroll';
	let names = results.__getall('meta', 'name');
	names.forEach(function(name) {
		panel.appendChild(page.newPanel(name, results[name]));
	});
}

function generateHeader(text) {
	let body = newEle('span');
	let label = newEle('span');
	label.innerText = text;
	body.appendChild(label);
	body.appendChild(newEle('br'));
	return body;
}

function generateInput(type, name, value) {
	let input = newEle('input');
	input.id = `editor.${type}.${name}`;
	input.value = value;
	input.style.display = "inline-block";
	input.style.width = "65%";
	let label = newEle('span');
	label.innerText = name;
	label.style.display = "inline-block";
	label.style.width = "35%";
	
	let combined = newEle('div');
	combined.style.width="100%";
	combined.appendChild(label);
	combined.appendChild(input);
	return combined;
}

client.editorSave = function() {
	let inputs = Array.from(document.querySelectorAll('input[id*=editor]'));
	inputs.forEach(function(input){
		let id = input.id;
		let vartype = id.split('.')[1];
		let varname = id.split('.')[2];
		let value = input.value;
		if(vartype == 'meta') {
			tapi[client.archetype].cache[client.workingItem]['__'+varname]=value;
		} else {
			tapi[client.archetype].cache[client.workingItem][vartype][varname]=value;
		}
	});
	tapi[client.archetype].commit(tapi[client.archetype].cache);
	msg('Saved!');
}

client.workingItem = '';

function editor(item) {
	client.workingItem = item.__name;
	let body = newEle('div');
	body.style.width="100%";
	body.appendChild(generateHeader('Meta data'));
	
	let saveButton = newEle('button');
	saveButton.innerText = 'Save';
	saveButton.onclick = function() {
		client.editorSave();
	}
	body.appendChild(saveButton);
	
	['name', 'gadgetname', 'filename', 'folder'].forEach(function(meta) {
		body.appendChild(generateInput('meta', meta, item['__'+meta]));
	});
	
	if(Object.keys(item.normal).length > 0) {
		
		body.appendChild(generateHeader('Variables'));
		
		Object.keys(item.normal).forEach(function(key) {
			body.appendChild(generateInput('normal', key, item.normal[key]));
		});
	}
	
	if(Object.keys(item.common).length > 0) {
	
		body.appendChild(generateHeader('COMMON'));
		
		Object.keys(item.common).forEach(function(key) {
			body.appendChild(generateInput('common', key, item.common[key]));
		});
	}
	
	if(Object.keys(item.version).length > 0) {
	
		body.appendChild(generateHeader('VERSION'));
		
		Object.keys(item.version).forEach(function(key) {
			body.appendChild(generateInput('version', key, item.version[key]));
		});
	}
	
	if(Object.keys(item.damage).length > 0) {
	
		body.appendChild(generateHeader('DAMAGE'));
		
		Object.keys(item.damage).forEach(function(key) {
			body.appendChild(generateInput('damage', key, item.damage[key]));
		});
	}
	
	return body;
	
}

window.onload = function() {
	log("Welcome to the tapi client testing facility!");
	log("source: hpi_out");
	log("folders in hpi_out: units, weapons, features, guis, downloads");
	log("F12 for console, tapi (for tapi.units.__search etc), client.results (for search results)");
	client.getBuilds();
	setInterval(handles.search, 100);
}









