// MooTools: the javascript framework.
// Load this file's selection again by visiting: http://mootools.net/more/417ab68a672f38ea1c04efab47af2ff7 
// Or build this file again with packager using: packager build More/Assets
/*
---
copyrights:
  - [MooTools](http://mootools.net)

licenses:
  - [MIT License](http://mootools.net/license.txt)
...
*/
MooTools.More={version:"1.3.0.1",build:"6dce99bed2792dffcbbbb4ddc15a1fb9a41994b5"};var Asset={javascript:function(d,b){b=Object.append({document:document},b);
if(b.onLoad){b.onload=b.onLoad;delete b.onLoad;}var a=new Element("script",{src:d,type:"text/javascript"});var c=b.onload||function(){},e=b.document;delete b.onload;
delete b.document;return a.addEvents({load:c,readystatechange:function(){if(["loaded","complete"].contains(this.readyState)){c.call(this);}}}).set(b).inject(e.head);
},css:function(b,a){a=a||{};var c=a.onload||a.onLoad;if(c){a.events=a.events||{};a.events.load=c;delete a.onload;delete a.onLoad;}return new Element("link",Object.merge({rel:"stylesheet",media:"screen",type:"text/css",href:b},a)).inject(document.head);
},image:function(c,b){b=Object.merge({onload:function(){},onabort:function(){},onerror:function(){}},b);var d=new Image();var a=document.id(d)||new Element("img");
["load","abort","error"].each(function(e){var g="on"+e;var f=e.capitalize();if(b["on"+f]){b[g]=b["on"+f];delete b["on"+f];}var h=b[g];delete b[g];d[g]=function(){if(!d){return;
}if(!a.parentNode){a.width=d.width;a.height=d.height;}d=d.onload=d.onabort=d.onerror=null;h.delay(1,a,a);a.fireEvent(e,a,1);};});d.src=a.src=c;if(d&&d.complete){d.onload.delay(1);
}return a.set(b);},images:function(c,b){b=Object.merge({onComplete:function(){},onProgress:function(){},onError:function(){},properties:{}},b);c=Array.from(c);
var a=0;return new Elements(c.map(function(e,d){return Asset.image(e,Object.append(b.properties,{onload:function(){a++;b.onProgress.call(this,a,d,e);if(a==c.length){b.onComplete();
}},onerror:function(){a++;b.onError.call(this,a,d,e);if(a==c.length){b.onComplete();}}}));}));}};