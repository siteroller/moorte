/*
---
description: Snippets that keep floating in and out of the sourcecode.

license: MIT-style

authors:
- Sam Goody

requires:
- none

provides: [none]

*/

MooRTE.Utilities.clean = function(){

	//If html is an element, process all of that element's innards.  Perhaps even offer taking the outerhtml.  If not, use a separate element to dump stuff into.
	For washer, we can use a iframe instead of an element - may be needed for the whole body or similar.
	var washer = ( $('washer') ? $('washer') : new IFrame({ id:'washer', 'class':'mHide' }).inject(document.body)).contentWindow.document;
	washer.open();
	washer.write('<html><body id="washer">'+html+'</body></html>');
	washer.close();
	washer = $(washer.body);

	//Use css selector engine to cleanup instead of regex to avoid many pitfalls!
	$$('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) $el.replaces(p)  });
	$$('br:last-child').each(function(el){ if(!el.nextSibling && 'h1h2h3h4h5h6lip'.contains(el.getParent().get('tag'))) el.destroy(); });		//$$('br:last-child').filter(function(el) { return !el.nextSibling; })

},

MooRTE.Utilities.remove: function(mi, keep){							// I plan on extending elements with remove() as well as hide() and deleting this.
	mi = mi.hasClass('miMooRTE') ? mi : mi.retrieve('bar');
	if(!keep) mi.destroy();
	else if(keep === true) mi.addClass('.miHide');
	else{ MooRTE.removed[keep] = mi; new Element('span').replaces(mi).destroy(); } 
},	

function generic(){
	var loop = 0;
	do{
	//...
	} while(loop && ++loopStop < 5);
}

function eventHandler(){
	var func = prop.split(/^([^\(]+)(\((.*)\))?/);
	var event = if (args.test(/^on[A-Z]/)); 
	//case 'object': case 'array', which will be made into a new toolbar!
}

MooRTE.Range = {
	set:function(rangeName){
		var range = MooRTE.ranges[rangeName || 'a1'];
		if(range.select) range.select(); 
		else{
			var sel = window.getSelection ? window.getSelection() : window.document.selection;
			if (sel.removeAllRanges){ 
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
		return MooRTE.Range;
	}
}

addElements: function(buttons, place, relative, name){
	//....
	events:{
		'mousedown': function(e){
			//...
			//Check to ensure that the range is within an area controlled by the activeBar:
			var selected = MooRTE.Range.parent(),ok;
			MooRTE.activeBar.retrieve('fields').each(function(field){ if(field.hasChild(selected)){ ok=1; break;} });
			if(!ok)return;
			// Or check that the range is in an area which has been extended (but could be through a second instance of MooRTE).
			if(!MooRTE.activeField.hasChild(MooRTE.Range.parent()))return; 
		}
	}
}

function arrayCompare(array1, array2, exact){
		if(!exact){ 
			array1.sort();
			array2.sort();
		}
		return array1.toString() === array2.toString();
}

function outerhtml(el){
	var wrap = new Element('div').wraps(el), html = wrap.get('html'); 
	el.inject(wrap, 'after');
	wrap.destroy();
	return html;
}

function focus(el){
	el = el.firstChild;
	do{	if (el.nodeType == 3) el.focus(); break;
	} while (el = el.nextSibling); 
}


MooRTE.Utilities:{
...
assetLoader:function(args){
		
		if(MooRTE.Utilities.assetLoader.busy) return MooRTE.Utilities.assetLoader.delay(750,this,args);
		var head = $$('head')[0], path = MooRTE.path.slice(0,-1), path = path.slice(0, path.lastIndexOf('/')+1), path = MooRTE.pluginpath||path, me = args.me;// + (args.folder || '')
		var hrefs = head.getElements('link').map(function(el){return el.get('href')});
		
		//if(args.me) Hash.erase(MooRTE.Elements[args.me], 'onLoad');
		if(args.styles) $splat(args.styles).each(function(file){
			if(!hrefs.contains(path+file)) Asset.css(path+file);
		});
		
		var srcs = head.getElements('script[src]').map(function(el){return el.get('src')});
		var scripts = args.scripts.filter(function(script){ 
			return !srcs.contains(path+script);
		});
		if(!scripts[0] || (args['class'] && window[args['class']])) return args.onComplete.run(); 
		MooRTE.Utilities.assetLoader.busy = true;
		var curPos = me.getStyle('background-position'), curImg = me.getStyle('background-image');
		me.setStyles({'background-image':'url("'+MooRTE.path+'images/loading.gif")','background-position':'1px 1px'});
		var loaded = function(){
			me.setStyles({'background-image':curImg, 'background-position':curPos}); 
			MooRTE.Utilities.assetLoader.busy = false;
			args.onComplete(); 
		};
		var aborted = function(){
			MooRTE.Utilities.assetLoader.busy = false;
		};
		if(args.scripts){
			var last = args.scripts.length, count=0;
			$splat(args.scripts).each(function(file){
				++count == last && args.onComplete ?  Asset.javascript(path+file, {onload:loaded, onabort:aborted}) : Asset.javascript(path+file);
			});
		};
		
		/* new Loader({scripts:$splat(path+js), onComplete:onload, styles:$splat(path+css)});
		   $splat(js).each(function(file){ Asset.javascript(path+file,{'onload':onload.bind(self)}	);})//+'?a='+Math.random()//(file==$splat(js).getLast() && onload ? onload : $empty)});	//,{ onload:(onload||$empty) }Array.getLast(js)		
		*/
	},
})

/*#*/	'|'            :{text:'|', title:'', element:'span'},
/*#*/	'insertimage'  :{onClick:function(args, classRef){ 
							classRef.exec([this.getParent().getElement('input[type=text]').get('text')]) 
						}},
/*#*/	popupURL		:{ img:46, title:'Create hyperlink', 
							onClick:function(){
								MooRTE.Range.create();
								$$('#pop,#popupURL').removeClass('popHide');
								$('popTXT').set('value',MooRTE.Range.get('text', MooRTE.ranges.a1));
							},
							onLoad:function(){
								MooRTE.Utilities.assetLoader({ //new Loader({
									'class':'Popup',
									scripts: [MooRTE.path+'plugins/Popup/Popup.js'], 
									styles:[MooRTE.path+'plugins/Popup/Popup.css'], 
									onComplete:function(){
										var html = "<span>Text of Link:</span><input type='text' id='popTXT'/><br/>\
											<span>Link to:</span><input type='text' id='popURL'/><br/>\
											<div class='radio'> <input type='radio' name='pURL' value='web' checked/>Web<input type='radio' name='pURL' value='email'/>Email</div>\
											<div class='btns'><input id='purlOK' type='submit' value='OK'/><input id='purlCancel' type='submit' value='Cancel'/></div>";
										var pop = new Popup('popupURL', html, 'Edit Link');
										pop.getElement('#purlCancel').addEvent('click', function(e){
											Popup.hide(); e.stop();
										});
										pop.getElement('#purlOK').addEvent('click', function(e){
											MooRTE.Range.set();												//MooRTE.activeBar.retrieve('ranges').set();
											var value = pop.getElementById('popURL').get('value');
											MooRTE.Utilities.exec(value ? 'createlink' : 'unlink', value); 
											Popup.hide();
											e.stop(); 
										});
										Popup.hide();
									} 
								})
							}
						},
/*#*/	blockquote2		:{	onClick:function(){
								var RangeText =  MooRTE.Range.get('html');
								var block = new Element('blockquote').set('html', RangeText);
								MooRTE.Range.replace(block);
							}
						}

}

path:(URI ? new URI($$('script[src*=moorte.js]')[0].get('src')).get('directory') : '') 