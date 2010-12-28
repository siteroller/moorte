/*
---
description: Lazy Loader for CSS and JavaScript files.
copyright: December 2010 Sam Goody
license: OSL v3.0 (http://www.opensource.org/licenses/osl-3.0.php)
authors: Sam Goody <siteroller - |at| - gmail>

requires:
- core

provides: [ AssetLoader.javascript
		  , AssetLoader.css
		  , AssetLoader.images
		  , AssetLoader.mixed  
		  ,	AssetLoader.path
		  ]
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
		, script: { chain: true }
		, defaults: { path: ''
			   , onComplete: function(){}
			   , onProgress: function(){}
			   , onInit: function(){}
		       , chain: false
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
		if (!files.length) return false; //alert('err: No Files Passed');
		
		var file = files.shift()
		  , path = [file.path, options.path, AssetLoader.path].pick() + [file.src, file.href, file].pick(); // (file.src || file.href)
		
		AssetLoader.build();
		if (type == 'mixed') type = AssetLoader.type(file);
		file = Object.merge({events:{}}, file); // If file is not an object, FF ignores it. Webkit creates it equal to undefined. Either way it is not passed to the object
		file[type == 'link' ? 'href' : 'src'] = path;
		options = Object.merge({}, AssetLoader.options.defaults, AssetLoader.options[type] || {}, options);
		
		var chain = [file.chain, options.chain].pick()
		  , loaded = file.onload || file.onLoad || file.events.onLoad || function(){}

		if (AssetLoader.loaded[type][path]){
			loaded.call(AssetLoader.loaded[type][path]);
			files.length
				? AssetLoader.load(files, options, type)
				: options.onComplete();
			return; // ToDo: Should return an object
		};
		if (AssetLoader.loading[path]){
			AssetLoader.loading[path].push(loaded);
			if (!files.length) AssetLoader.loading[path].push(options.onComplete);
			return; // ToDo: Should return an object
		};
		AssetLoader.loading[path] = [];
		
		['onLoad','onload','chain','path'].each(function(prop){
			delete file.events[prop] || file[prop];
		});
		
		var asset = new Element(type, Object.merge(AssetLoader.properties[type], file));
		function loadEvent(){
			//me.setStyles({'background-image':curImg, 'background-position':curPos}); 
			loaded.call(asset);
			AssetLoader.loading[path].each(function(func){func()});
			delete AssetLoader.loading[path];
			AssetLoader.loaded[type][path] = this;
			options.onProgress.call(this, this);
			if (files.length) AssetLoader.load(files, options, type);
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
		Object.each({script:'src',link:'href',img:'src'},function(path,tag){
			AssetLoader.loaded[tag] = {}
			$$(tag+'['+path+']').each(function(el){AssetLoader.loaded[tag][el.get(path)] = el});
		});
		return function(){};
	  }
	, type: function(file){
		var file = file.src || file;
		if (file.href || /css$/.test(file)) return 'link';
		if (/js$/.test(file)) return 'script';
		if (/(jpg|jpeg|bmp|gif|png)$/.test(file)) return 'img';
		return 'fail';
	  }
	};

Object.each({javascript:'script', css:'link', image:'img', images:'img', mixed:'mixed'}, function(val, key){
	AssetLoader[key] = function(files, options){
		AssetLoader.load(Array.from(files), options, val);
	};
});
window.addEvent('load', function(){ AssetLoader.build = AssetLoader.build()});
var Asset = AssetLoader;
/*
// Test:
window.addEvent('domready', function(){
	AssetLoader.path = 'CMS/library/thirdparty/MooRTE/Source/Assets/';
	var mike = new AssetLoader.mixed
		( [{src: 'scripts/StickyWinModalUI.js'}]
		, { onComplete: function(){ log('done first') } }
		);
	var mike2 = function(){
		new AssetLoader.mixed
		( ['scripts/StickyWinModalUI.js']
		, { onComplete: function(){ log('done later') } }
		);
	}.delay('1000');
})
/*/