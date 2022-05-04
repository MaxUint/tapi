# tapi
API For Total Annihilation unit configuration
<h1> Example code </h1>
<code>

    console.time('tapi script ran in');

    const tapi = require('./tapi');

    //tapi.RESTART_TAPI(); //restarts all save states/builds (used for testing only);

    let engineName = "myEngine";

    let myEngine = tapi.load(engineName);

    if(!myEngine) {
        myEngine = tapi.create(
            ({
                source:'hpi_out', 
                name:(engineName), 
                folders : ({
                    units:'UNITS', 
                    weapons:'Weapons', 
                    features:'features', 
                    guis:'guis', 
                    downloads:'download'
                })
            })
        );
    };

    console.log('current build number', myEngine.version);

    let units = myEngine.units;
                    
            console.log('changing all core metal costs to +200% and all arm energy costs to +200%');
            
            units.comit(
                units.__search(field='side', value='CORE').__search('buildcostmetal').__foreach(vartype='normal', 'buildcostmetal', 'return buildcostmetal*=2')
            );
            
            units.comit(
                units.__search(field='side', value='ARM').__search('buildcostenergy').__foreach(vartype='normal', 'buildcostenergy', 'return buildcostenergy*=2')
            );

    let weapons = myEngine.weapons;
            
            console.log('There are', weapons.__search().__count(), 'total weapons');
            
            weapons = weapons.__search(field = 'range', value='>900');
            console.log('The following weapons have over 900 range, (', weapons.__count('excluded'), ' weapons not included have below 900 range )');    
            console.log(weapons.__getall(vartype='normal','name').join(', '));
            
            weapons.__foreach(vartype='normal', 'range', 'return range *=0.5');
            console.log('decrease listed weapons range by 200%');
            tapi.weapons.comit(weapons);


    let features = myEngine.features;
            
            features.comit(
                features.__search('seqname', 'acidmetal01').__foreach(vartype = 'normal', 'height', 'return height+=2')
            );
            
            console.log('acidmetal01 height is now', features.__search('seqname', 'acidmetal01').__getall(vartype = 'normal', 'height'));
            
    myEngine.compile();

    console.timeEnd('tapi script ran in');
    
</code>
