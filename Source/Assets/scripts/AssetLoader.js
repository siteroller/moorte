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

provides: [AssetLoader, AssetLoader.load, AssetLoader.options, AssetLoader.assets]

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
var AssetLoader = new Class({
	Implements: Options
	, options: {
		path: ''
		, jspath: ''
		, csspath: ''
		, onComplete: ''
		, chain: true
	}
	, initialize: function(options, files){
		if (!AssetLoader.scripts) this.once();
		this.setOptions(options);
		if (files) this.load(files);
		}
	, load: function(files){
		if (files.src || files.href || !Type.isObject(files)) files = this.mixed(files);
		else if (files.mixed) Object.merge(files,this.mixed(files.mixed));
		
		if (files.js && files.js.length){
			this.JS = Array.from(files.js);
			this.loadJS();
			}
		if (files.css && files.css.length) this.loadCSS(files.css);
		if (files.fail) AssetLoader.fails.append(files.no)
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
		AssetLoader.fails = [];
		AssetLoader.loading = {};
		}.protect()
	, mixed: function(files){
		var obj = {js:[],css:[],fail:[]};
		Array.from(files).each(function(file){
			obj[ file.src ? 'js'
			   : file.href ? 'css'
			   : Array.from(file.match && file.match(/(j|cs)s$/i) || 'fail')[0]
			   ].push(file);
		});
		return obj;
		}.protect()
	, loadJS: function(){
		if (!this.JS.length) return alert('err #138');
		files = this.JS;
		var self = this
		  , file = this.JS.shift()
		  , chain = file.chain != undefined ? file.chain : this.options.chain;
		
		file = Object.merge(
			  {events:{}}
			, file.src ? file : {}
			, { src: [file.path,files.path,this.options.path].pick() 
				  + [file.jspath, files.jspath,this.options.jspath].pick() 
				  + (file.src || file)
			  }
			);
		var loaded = file.onload || file.onLoad || file.events.onLoad || function(){};
		if (AssetLoader.scripts.contains(file.src)){
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
		
		if (!chain && self.JS.length) this.loadJS();
		}.protect()
	, loadCSS: function(files){
		Array.from(files).each(function(file){
			if (!file.href) file = {href:file};
			var path = ((file.path || '') + file.csspath || this.options.path + this.options.csspath) + file.href;
			['path','csspath','jspath','chain'].each(function(rule){delete file[rule]});
			
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
// Test:
window.addEvent('domready', function(){
	var mike = new AssetLoader(
		{ jspath: 'scripts/'
		, path: 'CMS/library/thirdparty/MooRTE/Source/Assets/'
		, onComplete: function(){ log('done') }
		}
		, {js: ['StickyWinModalUI.js']}
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