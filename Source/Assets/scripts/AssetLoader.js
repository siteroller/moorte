/*
---
description: Lazy Loader for CSS, image and JavaScript files.
copyright: Sam Goody, December 2010.
license: OSL v3.0 (http://www.opensource.org/licenses/osl-3.0.php)
authors: Sam Goody <siteroller - |at| - gmail>

requires:
- core

provides: [ AssetLoader.javascript
		  , AssetLoader.css
		  , AssetLoader.images
		  , AssetLoader.mixed  
		  , AssetLoader.path
		  ]
        
credits: Syntax and some hacks based on the More-Assets Class, which this is meant to replace.
...
*/

var AssetLoader  = 
	{ options: 
		{ script:  { chain: true }
		, defaults:{ chain: false
                   , onInit: function(){}
                   , onComplete: function(){}
                   , onProgress: function(){}
                   , path: ''
                   }
                   , path:    ''
		}
	, properties:
		{ script:{ type: 'text/javascript' }
		, link:  { rel: 'stylesheet'
                 , media: 'screen'
                 , type: 'text/css'
                 }
		, img:   {}
		}
	, load: function(files, options, type, obj, index){
        AssetLoader.build();
        if (!files.length) return alert('err: No Files Passed'); //false;
		
        var file = files.shift()
          , chain = file.chain  
          , path = ([file.path, options.path, AssetLoader.path].pick() || '') + [file.src, file.href, file].pick();
		
        if (type == 'mixed') type = AssetLoader.type(file);
        var opts = Object.merge({events:{}}, AssetLoader.options.defaults, AssetLoader.options[type] || {}, options);
        file = Object.merge(file.big ? {} : file, opts);
        file[type == 'link' ? 'href' : 'src'] = path;
        
        var events = ['load','error','abort'];
        events.each(function(prop){
           [prop, 'on'+prop, 'on'+prop.capitalize()].some(function(item,i){
              var where = i ? file.events : file;
              if (!where[item]) return false;         
              opts[prop] = where[item];
              delete where[item];
           });
        });
        if (!opts.load) opts.load = file.onProgress;
        Object.each(AssetLoader.options.defaults, function(v,k){ delete file[k] });

        var exists, i = ++index[1];
        if (exists = AssetLoader.loaded[type][path]){
           opts.load.call(exists, ++index[0], i, path);
           files.length
              ? AssetLoader.load(files, options, type, obj, index)
              : opts.onComplete();
           obj[type].push(exists);
           return obj;
        };
        if (exists = AssetLoader.loading[path]){
           Object.map(exists, function(methods, event){ return methods.push(opts[event]) });
           if (!files.length) exists.load.push(opts.onComplete);
           return obj;
        };
        AssetLoader.loading[path] = {load:[],abort:[],error:[]};

        var asset = new Element(type, Object.merge(AssetLoader.properties[type], file));
        var callEvent = function(event){
           opts[event].call(asset, ++index[0], i, path);
           AssetLoader.loading[path][event].each(function(func){func.call(asset, index[0], i, path)});
           delete AssetLoader.loading[path];
           AssetLoader.loaded[type][path] = this;
           
           if (files.length)
              AssetLoader.load(files, options, type, obj, index);
           else {
              opts.onInit();
              opts.onComplete();
           }
        };
        
        var ie = Browser.ie && !Browser.ie9
           , image = new Image();
        events.each(function(event){
           if (ie && type == 'img'){
              // would have been
              asset['on'+event] = callEvent.pass(event);
              
              // copied from Assets.js
              if (!image) return;
              if (!element.parentNode){
                 element.width = image.width;
                 element.height = image.height;
              }
              image = image.onload = image.onabort = image.onerror = null;
              event.delay(1, element, element);
              element.fireEvent(name, element, 1);
              
              // perhaps:
              
           } else asset.addEvent(event, callEvent.pass(event));
        });
        if (ie && type == 'script') asset.addEvent('readystatechange', function(){
           if ('loaded,complete'.contains(this.readyState)) callEvent('load');
        });
        if (type != 'img') asset.inject(document.head);
        
        if (!chain && files.length) AssetLoader.load(files, options, type, obj, index);
        return obj;
	  }
	, loaded: {}
	, loading: {}
	, build: function(){
        Object.each({script:'src',link:'href',img:'src'},function(path,tag){
           AssetLoader.loaded[tag] = {};
           $$(tag+'['+path+']').each(function(el){AssetLoader.loaded[tag][el.get(path)] = el});
        });
        return function(){};
     }
	, type: function(file){
        var file = file.src || file;
        if (file.href || /css$/i.test(file)) return 'link';
        if (/js$/i.test(file)) return 'script';
        if (/(jpg|jpeg|bmp|gif|png)$/i.test(file)) return 'img';
        return 'fail';
	  }
	, wait:function(){
          me.setStyles({'background-image':curImg, 'background-position':curPos}); 
	  }
	};

Object.each({javascript:'script', css:'link', image:'img', images:'img', mixed:'mixed'}, function(val, key){
	AssetLoader[key] = function(files, options){
      AssetLoader.load(Array.from(files), options, val, {img:[],link:[],script:[],fail:[]}, [-1,-1]);
	};
});
window.addEvent('domready', function(){ AssetLoader.build = AssetLoader.build()});
var Assets = AssetLoader;
/*/
function log(){
	if (log.off) return;
	Array.clone(arguments).each(function(arg){
		if (console) console.log(arg);
	})
}
/*/
//*/
// Test:
window.addEvent('domready', function(){
AssetLoader.path = 'CMS/library/thirdparty/MooRTE/Source/Assets/';
//*/
//*/
	var mike = new AssetLoader.mixed
		//( [{src: 'scripts/StickyWinModalUI.js'}]
		( 'scripts/StickyWinModalUI.js'
		, { onComplete: function(){ console.log('done first') } }
		); 
//*/
//*/
	var mike2 = function(){
		new AssetLoader.mixed
		( ['scripts/StickyWinModalUI.js']
		, { onload: function(){log('coming along now'); log(arguments); log(this)}
		, onComplete: function(){ console.log('done later'); } }
		);
	}.delay('1000');
//*/
//
 })
