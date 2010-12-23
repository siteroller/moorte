/*
---
description: Lazy Loader for CSS and JavaScript files.

copyright:
- December 2010 Sam Goody

license: OSL v3.0 (http://www.opensource.org/licenses/osl-3.0.php)

authors:
- Sam Goody <siteroller - |at| - gmail>

requires:
- core

provides: [AssetLoader, AssetLoader.load, AssetLoader.Path, AssetLoader.loaded]

credits:
- Unhappy with "More::Assets", Depender, and other attempts I've seen.
- This was done to fill MooRTE needs; expect it to be buggy and incomplete, with odd design decisions.
...
*/
/*
Usage:
- var loader = new AssetLoader('scripts.js') // Loads in one script or css file
- var loader = new AssetLoader().load('script.js');
- var loader = new AssetLoader({
					JSPath: 'scripts/'
					, Path: 'CMS/library/thirdparty/MooRTE/Source/Assets/'
					, onComplete: function(){ console.log('all scripts have been loaded') }
					});
loader.load({
						js: [{src:'StickyWinModalUI.js'}]
						});
				
				
Usage
AssetLoader([options]);
returns
	The AssetLoader Class
options[object]
	Path: prepended to every file that is included by the class.
	JSPath: prepended to every JS file, after the Path (if exists).
	CSSPath: prepended to every JS file, after the Path (if exists).
	onComplete: Run when all scripts have loaded. Does not wait for styles to load.
	nochain: whether scripts should load simultaneusly or not
	
Assets.load(options)
returns
	true if files are attached, before the are loaded.
options[mixed]	
	string/array
		files	
	object
		js: files
		css: files
		mixed: files

	Where 'files' can be a single file or an array of files.
	Each file can be either:
		string - the path to the JS/CSS file, relative to the html page.  eg 'Assets/myscripts.js'
		object - the options that are passed into the script/link tag.  eg {src:'Assets/myscripts.js', events:{load: myFunc}}
			When an object, each of the Class Options can be overridden for that file.  eg {src:'Assets/myscripts.js', path:''}
				
	When passed as js:files the files are assumed to be scripts, no matter what the file extension.
	When passed as mixed:files, the filetypes are determined dynamically.
	
	eg - load({mixed:['myfile.css', 'myfile.js', {href:'myfile.php'}]});
	is the same as - load(['myfile.css', 'myfile.js', {href:'myfile.php'}]);
		Will assume the first file is CSS, the latter are js;
		The first two based on the file extension, the last as links do not have a 'src' attribute.

	If a file is attached multiple times, it will only be included in the page once.
	onLoad and onComplete will run each time it is attached.
	initLoad will only run the first time the page is attached. 
		eg { src:'myfile.js'
		   , initLoad: function(){alert('File being included for the first time.')}
		   , onLoad: function(){alert('File included. Again!')}
		   }
*/
var AssetLoader = new Class({
	Implements: Options
	, options: {
		path: ''
		, jspath: ''
		, csspath: ''
		, onComplete: ''
		, nochain: false
	}
	, initialize: function(options, files){
		if (!AssetLoader.scripts) this.once();
		this.setOptions(options);
		if (files) this.load(files);
		}
	, load: function(files){
		if (files.src || files.href || !Type.isObject(files)) files = this.mixed(files);
		else if (files.mixed) Object.merge(files,this.mixed(files.mixed));
		
		if (files.js){
			this.JS = Array.from(files.js);
			this.loadJS();
			}
		if (files.css) this.loadCSS(files.css);
		}
	, once: function(){
		var head = $(document.head);
		AssetLoader.scripts =
			head
				.getElements('script[src]')
				.map(function(el){return el.get('src')});
		AssetLoader.styles =
			head
				.getElements('link')
				.map(function(el){return el.get('href')});
		AssetLoader.loading = {};
		}.protect()
	, mixed: function(files){
		var obj = {js:[],css:[]};
		Array.from(files).each(function(file){
			if (file.src) obj.js.push(file);
			else if (file.href) obj.css.push(file);
			else obj[file.match(/(j|cs)s$/i)[0]].push()
		});
		return obj;
		}.protect()
	, loadJS: function(){
		var self = this
		  , file = this.JS.shift() || {src:1,loaded:1}
		  , nochain = this.nochain || file.nochain || false;
		
		file = Object.merge(
			  {events:{}}
			, file.src ? file : {}
			, {src:this.JSPath + (file.src || file)}
			);
		
		var loaded = file.onload || file.onLoad || file.events.onLoad || function(){};
		if (file.loaded || AssetLoader.scripts.contains(file.src)){
			loaded();
			this.JS.length
				? this.loadJS()
				: this.options.onComplete();
			return;
		};
		if (AssetLoader.loading[file.src]){
			AssetLoader.loading[file.src].push(loaded);
			if (!this.JS.length) AssetLoader.loading[file.src].push(self.options.onComplete);
			return;
		};
		AssetLoader.loading[file.src] = [];
		
		['onLoad','onload','chain'].each(function(prop){
			delete file.events[prop] || file[prop];
		});
		
		var script = new Element('script'
			, Object.merge(file, {
				type: 'text/javascript'
				, events: {
					load: function(){
						//me.setStyles({'background-image':curImg, 'background-position':curPos}); 
						loaded();
						AssetLoader.loading[file.src].each(function(func){ func(); });
						AssetLoader.scripts.push(file.src);
						self.JS.length
							? self.loadJS()
							: self.options.onComplete();
						}
					, readystatechange: function(){
						if ('loaded,complete'.contains(this.readyState)) loaded.call(this);
						}
					}
				})
			).inject(document.head);
		
		if (nochain) this.loadJS();
		}.protect()
	, loadCSS: function(files){
		Array.from(files).each(function(file){
			if (!file.href) file = {href:file};
			var path = ((file.path || '') + file.csspath || this.options.path + this.options.csspath) + file.href;
			['path','csspath','jspath','nochain'].each(function(rule){delete file[rule]});
			
			if (!AssetLoader.styles.contains(file.href)){
				AssetLoader.styles.push(file.href);
				new Element('link'
						   , Object.merge( { rel: 'stylesheet'
										   , media: 'screen'
										   , type: 'text/css'
										   }
										 , file
										 , { href: path }
										 )
						   ).inject(document.head);
				};
			});
		}.protect()
});

/*
//.filter(function(script){
//	return !AssetLoader.scripts.contains(files.Path + files.JSPath + (script.src || script))
//	})

*/
window.addEvent('domready', function(){
	var mike = new AssetLoader({
		JSPath: 'scripts/'
		, Path: 'CMS/library/thirdparty/MooRTE/Source/Assets/'
		, js: ['StickyWinModalUI.js']
		, onComplete: function(){ console.log('done') }
	});
	var mike2 = function(){
		new AssetLoader({
			JSPath: 'scripts/'
			, Path: 'CMS/library/thirdparty/MooRTE/Source/Assets/'
			, js: [{src:'StickyWinModalUI.js'}]
			, onComplete: function(){ console.log('done3') }
		});
	}.delay('1000');
	
})