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

provides: [ AssetLoader.javascript
		  , AssetLoader.css
		  , AssetLoader.images
		  , AssetLoader.mixed
		  
		  ,	AssetLoader.path
		  , AssetLoader.loaded
		  , AssetLoader.loading 
		  ]

credits:
- Unhappy with "More::Assets", Depender, and other attempts I've seen.
- This was done to fill MooRTE needs; expect it to be buggy and incomplete, with odd design decisions.
...
*/

function log(){
	if (log.off) return;
	Array.clone(arguments).each(function(arg){
		if (console) console.log(arg);
	})
}
var AssetLoader  = 
	{ options: 
		{ path: ''
		, mixed: {}
		, javascript: {}
		, css: { chain: false }
		, all: { path: ''
			   , onComplete: function(){}
			   , onInit: function(){}
		       , chain: true
		       }
		}
	, properties:
		{ script: { type: 'text/javascript' }
		, link: { rel: 'stylesheet'
				, media: 'screen'
				, type: 'text/css'
				}
		, img: {}
		}
	, load: function(files, options, type){
		files = Array.from(files)
		if (!files.length) return false; //alert('err: No Files Passed');
		
		var self = AssetLoader
		  , file = files.shift()
		  , path = [file.path, self.path, options.path].pick() + [file.src, file.href, file].pick(); // (file.src || file.href)
		
		file = Object.merge({events:{}}, file);
		file[type == 'link' ? 'href' : 'src'] = path;
		options = Object.merge({}, AssetLoader.options.all, AssetLoader.options[type], options);
		
		var chain = [file.chain, options.chain].pick()
		  , loaded = file.onload || file.onLoad || file.events.onLoad || function(){}

		if (AssetLoader.loaded[path]){
			loaded.bind(AssetLoader.loaded[path])();
			files.length
				? self.load(files, options, type)
				: options.onComplete();
			return; // ToDo: Should return an object
		};
		if (AssetLoader.loading[path]){
			AssetLoader.loading[path].push(loaded);
			if (!files.length) AssetLoader.page.loading[path].push(options.onComplete);
			return; // ToDo: Should return an object
		};
		AssetLoader.loading[path] = [];
		
		['onLoad','onload','chain','path'].each(function(prop){
			delete file.events[prop] || file[prop];
		});
		
		var asset = new Element(type, Object.merge(self.properties[type], file));
		
		function loadEvent(){
			//me.setStyles({'background-image':curImg, 'background-position':curPos}); 
			loaded.bind(asset)();
			AssetLoader.loading[path].each(function(func){func()});
			delete AssetLoader.loading[path];
			AssetLoader.loaded.path = this;
			if (files.length) self.load(files, options, type);
			else {
				options.onComplete();
				options.onInit();
			}
		};
		if (type != 'img') asset.addEvent('load', loadEvent).inject(document.head);
		if (!chain && files.length) this.load(files, options, type);
	  }
	, loaded: {}
	, loading: {}
	, build: function(){
		$$('script[src]').each(function(el){AssetLoader[el.get('src')] = el});
		$$('link').each(function(el){AssetLoader[el.get('href')] = el});
		return function(){};
	  }
	, sort: function(files){
		var obj = {js:[],css:[],fail:[]};
		Array.from(files).each(function(file){
			obj[ file.src ? 'js'
			   : file.href ? 'css'
			   : Array.from(file.match && file.match(/(j|cs)s$/i) || 'fail')[0]
			   ].push(file);
		});
		return obj;
	  }
	};

Object.each({javascript:'script', css:'link', image:'img', images:'img'}, function(val, key){
	AssetLoader[key] = function(file, options){
		AssetLoader.load(file, options, val);
	};
});
window.addEvent('load', function(){ AssetLoader.build = AssetLoader.build()});
var Asset = AssetLoader;
/*
load: function(files){
	if (files.src || files.href || !Type.isObject(files)) files = this.mixed(files);
	else if (files.mixed) Object.merge(files,this.mixed(files.mixed));
	if (files.fail) AssetLoader.fails.append(files.no)
}

// Test:
window.addEvent('domready', function(){
	AssetLoader.path = 'CMS/library/thirdparty/MooRTE/Source/Assets/';
	var mike = new AssetLoader.mixed
		( [{src: 'scripts/StickyWinModalUI.js'}]
		, { onComplete: function(){ log('done') } }
		);
	var mike2 = function(){
		new AssetLoader(
		{ jspath: 'scripts/'
		, path: 'CMS/library/thirdparty/MooRTE/Source/Assets/'
		, onComplete: function(){ log('done') }
		}
		, [{js: ['StickyWinModalUI.js']}]
		);
	}.delay('1000');
})
*/