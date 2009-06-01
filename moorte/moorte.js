/* Copyright November 2008, Sam Goody, ssgoodman@gmail.com 
*   Licensed under the Open Source License
*
* 	Authors:		
*		Sam Goody (ssgoodman@gmail.com)
*		Mark Kohen
*		T. Anolik
*	Credits:
*	Based on the tutorial at: http://dev.opera.com/articles/view/rich-html-editing-in-the-browser-part-1.  Great job, Olav!!
*	Ideas and inspiration: Guillerr, MooEditable
*	Icons from OpenWysiwyg - http://www.openwebware.com
*	Cleanup regexs from CheeAun and Ryan's work on MooEditable (though the method of applying them is our own!)
*	We really want your help!  Please join!!
*	Notes:
*	The syntax myFunction.bind(myObj)(args) is used instead of myFunction.run(args,myObj) due to debugging problems in Firebug with the latter syntax!
*/

var MooRTE = new Class({
	
	Implements: [Options],

	options:{
		floating: false,
		location: 'elements', 											   			//[e,n,t,b,'']
		buttons: 'Menu:[Main,File,Insert,save]',
		skin: 'Word03',
		elements: 'textarea, .rte'
	},
	
	initialize: function(options){
		this.setOptions(options);
		var self = this, rte, els = $$(this.options.elements), l = this.options.location.substr(4,1).toLowerCase();
		if(!MooRTE.activeField) MooRTE.extend({ranges:{}, activeField:'', activeBtn:'', activeBar:'', path:new URI($$('script[src*=moorte.js]')[0].get('src')).get('directory') });
		
		els.each(function(el){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = self.textArea(el);
			if(l=='e' || !rte) rte = self.insertToolbar(l);  					//[L]ocation == elem[e]nts. [Creates bar if none or, when 'elements', for each element]
			if(l=='b' || l=='t' || !l) el.set('contentEditable', true).focus();		//[L]ocation == page[t]op, page[b]ottom, none[] 
			else l=='e' ? self.positionToolbar(el,rte) : el.addEvents({				//[L]ocation == elem[e]nts ? inli[n]e
				'click': function(){ self.positionToolbar(el, rte); },
				'blur':function(){ 
					rte.addClass('rteHide'); this.set('contentEditable', false);	
				}
			});
			el.store('bar', rte).addEvents({
				'mouseup':MooRTE.Utilities.updateBtns, 
				'keyup'  :MooRTE.Utilities.updateBtns, 
				'keydown':MooRTE.Utilities.shortcuts, 
				'focus'  :function(){ MooRTE.activeField = this; MooRTE.activeBar = rte; } //this.retrieve('bar');activeField is not used at all, activeBar is used for the button check.
			});
		})
		
		//MooRTE.activeBar = (MooRTE.activeField = els[0]).retrieve('bar');									//in case a button is pressed before anything is selected.
		els[0].fireEvent('focus');//,els[0]
		if(l=='t') rte.addClass('rtePageTop').getFirst().addClass('rteTopDown');
		else if(l=='b') rte.addClass('rtePageBottom');
		
		if(Browser.Engine.gecko) MooRTE.Utilities.exec('styleWithCSS');
		// MooRTE.Utilities.exec('useCSS', 'true'); - FF2, perhaps other browsers?
	},
	
	insertToolbar: function (pos){
		var self = this;
		var rte = new Element('div', {'class':'rteRemove MooRTE '+(!pos||pos=='n'?'rteHide':''), 'contentEditable':false }).adopt(
			 new Element('div', {'class':'RTE '+self.options.skin })
		).inject(document.body);
		MooRTE.activeBar = rte; // not used!
		MooRTE.Utilities.addElements(this.options.buttons, rte.getFirst(), 'bottom', 'rteGroup_Auto'); //Should give more appropriate name. Also, allow for last of multiple classes  
		return rte;
	},
	
	positionToolbar: function (el, rte){												//function is sloppy.  Clean!
		el.set('contentEditable', true).focus();
		var elSize = el.getCoordinates(), f=this.options.floating;
		rte.removeClass('rteHide').setStyle('width',elSize.width).store('fields', rte.retrieve('fields', []).include(el));
		if(f) rte.setStyles({ 'left':elSize.left, 'top':(elSize.top - rte.getFirst().getCoordinates().height > 0 ? elSize.top : elSize.bottom) }).addClass('rteFloat').getFirst().addClass('rteFloat');
		else rte.inject((el.getParent().hasClass('rteTextArea')?el.getParent():el),'top'); //'before'
	},
	
	textArea: function (el){
		var div = new Element('div', {text:el.get('value')});
		new Element('div', {'class':'rteTextArea '+el.get('class'), 'styles':el.getCoordinates() }).adopt(div, new Element('span')).setStyle('overflow','auto').inject(el, 'before');
		el.addClass('rteHide');
		return div;
	}
});

MooRTE.Utilities = {
	exec: function(args){
		args = $A(arguments).flatten(); 												// args can be an array (for the hash), or regular arguments(elsewhere).
		var g = (Browser.Engine.gecko && 'ju,in,ou'.contains(args[0].substr(0,2).toLowerCase())); //Fix for FF3 bug for justify, in&outdent
		if(g) document.designMode = 'on';//alert(args);
		document.execCommand(args[0], args[2]||null, args[1]||false);					//document.execCommand('justifyright', false, null);//document.execCommand('createlink', false, 'http://www.google.com');
		if(g) document.designMode = 'off';
	},
	
	storeRange:function(rangeName){
		var sel = window.getSelection ? window.getSelection() : window.document.selection;
		if (!sel) return null;
		//MooRTE.activeBar.retrieve('ranges').set([rangeName || 1] = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
		return MooRTE.ranges[rangeName || 'a1'] = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
	},
	
	setRange: function(rangeName) {
		var range = MooRTE.ranges[rangeName || 'a1']
		if(range.select) range.select(); 
		else{
			var sel = window.getSelection ? window.getSelection() : window.document.selection;
			if (sel.removeAllRanges){ 
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
		return MooRTE.Utilities;
 	},
	
	shortcuts: function(e){
		var be, btn, shorts = MooRTE.activeBar.retrieve('shortcuts');	
		if(e && e.control && shorts.has(e.key)){
			e.stop();
			btn = MooRTE.activeBar.getElement('.rte'+shorts[e.key]);
			btn.fireEvent('mousedown', btn);
		};
	},
	
	updateBtns: function(e){
		var val, update = MooRTE.activeBar.retrieve('update'); //vals[command, element, function]

		update.state.each(function(vals){ 
			if(vals[2]) vals[2].bind(vals[1])(vals[0]);
			else { window.document.queryCommandState(vals[0]) ? vals[1].addClass('rteSelected') : vals[1].removeClass('rteSelected');}
		});
		update.value.each(function(vals){
			if(val = window.document.queryCommandValue(vals[0])) vals[2].bind(vals[1])(vals[0], val);
		})
		update.custom.each(function(){
			vals[2].bind(vals[1])(vals[0]);
		})
	},
	
	addElements: function(buttons, place, relative, name){
		if(!place) place = MooRTE.activeBar.getFirst();
		var parent = place.hasClass('MooRTE') ? place : place.getParent('.MooRTE'), self = this, btns = []; 
		if($type(buttons) == 'string'){
			buttons = buttons.replace(/'([^']*)'|"([^"]*)"|([^{}:,\][\s]+)/gm, "'$1$2$3'"); 					// surround strings with single quotes & convert double to single quoutes. 
			buttons = buttons.replace(/((?:[,[:]|^)\s*)('[^']+'\s*:\s*'[^']+'\s*(?=[\],}]))/gm, "$1{$2}");		// add curly braces to string:string - makes {string:string} 
			buttons = buttons.replace(/((?:[,[:]|^)\s*)('[^']+'\s*:\s*{[^{}]+})/gm, "$1{$2}");					// add curly braces to string:object.  Eventually fix to allow recursion.
			while (buttons != (buttons = buttons.replace(/((?:[,[]|^)\s*)('[^']+'\s*:\s*\[(?:(?=([^\],\[]+))\3|\]}|[,[](?!\s*'[^']+'\s*:\s*\[([^\]]|\]})+\]))*\](?!}))/gm, "$1{$2}")));	// add curly braces to string:array.  Allows for recursive objects - {a:[{b:[c]}, [d], e]}.
			buttons = JSON.decode('['+buttons+']');
		}
	
		
		//the following should be a loop.  When was the loop removed and why?!
		if(btns[0]){ buttons = btns; btns = [];}
		$splat(buttons).each(function(item){
			switch($type(item)){
				case 'string': btns.push(item); break;
				case 'array' : item.each(function(val){btns.push(val)}); var loop = (item.length==1); break;	//item.each(buttons.push);
				case 'object': Hash.each(item, function(val,key){ btns.push(Hash.set({},key,val)) }); break;			
			}
		});

		btns.each(function(btn){
			var btnVals,btnClass;
			if ($type(btn)=='object'){btnVals = Hash.getValues(btn)[0]; btn = Hash.getKeys(btn)[0];}
			btnClass = btn.split('.');																		//[btn,btnClass] = btn.split('.'); - Code sunk by IE6
			btn=btnClass.shift();
			var e = parent.getElement('[class~='+name+']'||'.rte'+btn);
			
			if(!e || name == 'rteGroup_Auto'){
				var bgPos = 0, val = MooRTE.Elements[btn], input = 'text,password,submit,button,checkbox,file,hidden,image,radio,reset'.contains(val.type), textarea = (val.element && val.element.toLowerCase() == 'textarea');
				var state = 'bold,italic,underline,strikethrough,subscript,superscript,insertorderedlist,insertunorderedlist,unlink,'.contains(btn.toLowerCase()+',')
				
				var properties = $H({
					href:'javascript:void(0)',
					unselectable:(input || textarea ? 'off' : 'on'),
					title: btn + (val.shortcut ? ' (Ctrl+'+val.shortcut.capitalize()+')':''),	
					styles: val.img ? (isNaN(val.img) ? {'background-image':'url('+val.img+')'} : {'background-position':'0 '+(-20*val.img)+'px'}):'',
					events:{
						'mousedown': function(e){
							MooRTE.activeBtn = this;
							MooRTE.activeBar = this.getParent('.MooRTE');
							if(!val.onClick && (!val.element || val.element == 'a')) MooRTE.Utilities.exec(val.args||btn);
							else MooRTE.Utilities.eventHandler('onClick', this, btn);
							if(e && e.stop) input || textarea ? e.stopPropagation() : e.stop();					//if input accept events, which means keeping it from propogating to the stop of the parent!!
						}
					}
				}).extend(val);
				['args','shortcut','element','onClick','img','onLoad','onExpand','onHide','onShow','onUpdate',(val.element?'href':'null'),(Browser.Engine.trident?'':'unselectable')].map(properties.erase.bind(properties));
				e = new Element((input && !val.element ? 'input' : val.element||'a'), properties.getClean()).inject(place,relative).addClass((name||'')+' rte'+btn + (btnClass ? ' rte'+btnClass : ''));
					
				if(val.onUpdate || state) 
					parent.retrieve('update', $H({'value':[], 'state':[], 'custom':[] }))[
						'fontname,fontsize,backcolor,forecolor,hilitecolor,justifyleft,justifyright,justifycenter,'.contains(btn.toLowerCase()+',') ? 
						'value' : (state ? 'state' : 'custom')
					].push([btn, e, val.onUpdate]);
				if (val.shortcut) parent.retrieve('shortcuts',$H({})).set(val.shortcut,btn);
				MooRTE.Utilities.eventHandler('onLoad', e, btn);
				if (btnVals) MooRTE.Utilities.addElements(btnVals, e);
				else if (val.contains) MooRTE.Utilities.addElements(val.contains, e);
				//if (collection.getCoordinates().top < 0)toolbar.addClass('rteTopDown'); //untested!!
			}
			e.removeClass('rteHide')
		})
			
	},
	
	eventHandler: function(onEvent, caller, name){
		var event;
		if(!(event = $unlink(MooRTE.Elements[name][onEvent]))) return;
		switch($type(event)){
			case 'function': event.bind(caller)(name,onEvent); break;
			case 'string': MooRTE.Utilities.eventHandler(event, caller, name); break;
			case 'array': event.push(name,onEvent); MooRTE.Utilities[event.shift()].run(event, caller); break;
		}
	},
	
	group: function(elements, name){
		var self = this, parent = this.getParent('.RTE');
		(MooRTE.Elements[name].hides||self.getSiblings('*[class*=rteAdd]')).each(function(el){ 
			el.removeClass('rteSelected');
			parent.getFirst('.rteGroup_'+(el.get('class').match(/rteAdd([^ ]+?)\b/)[1])).addClass('rteHide');	//In the siteroller php selector engine, one can get a class that begins with a string by combining characters - caller.getSiblings('[class~^=rteAdd]').  Unfortunately, Moo does not support this!
			MooRTE.Utilities.eventHandler('onHide', self, name);
		});
		this.addClass('rteSelected rteAdd'+name);
		MooRTE.Utilities.addElements(elements, this.getParent('[class*=rteGroup_]'), 'after', 'rteGroup_'+name);
		MooRTE.Utilities.eventHandler('onShow', this, name);	
	},
	
	assetLoader:function(clas,folder,js,css,onload,key,event){
		
		Hash.erase(MooRTE.Elements[key],event);
		//if(window[clas]) return;
		
		var path = MooRTE.path+folder;
		new Loader({scripts:$splat(path+js), onComplete:onload, styles:$splat(path+css)});
		
		/*
		var self = this, path = MooRTE.path+folder;
		$splat(css).each(function(file){
			//Asset.css(path+file);			
		})
		$splat(js).each(function(file){
			Asset.javascript(path+file,{'onload':onload.bind(self)}	);//+'?a='+Math.random()//(file==$splat(js).getLast() && onload ? onload : $empty)});	//,{ onload:(onload||$empty) }Array.getLast(js)		
		})
		*/
	},
	
	clipboardPopup:function(command){
		if($('clipboardPopup')) $$('#pop,#clipboardPopup').removeClass('popHide');
		else{
			var html = "For your protection, Firefox does not allow access to the clipboard.<br/>  <b>Please use Ctrl+C to copy, Ctrl+X to cut, and Ctrl+V to paste.</b><br/>\
						(Those lucky enough to be on a Mac use Cmd instead of Ctrl.)<br/><br/>\
						If this functionality is important, consider switching to a less secure browser such as IE,<br/> which will allow us to easily access [and modify] your system.\
						<div class='btns'><input id='pCutCopyCancel' type='submit' value='OK'/></div>"; 
			new Popup('clipboardPopup', html, 'Security Restriction').getElement('#pCutCopyCancel').addEvent('click', function(e){
				$$('#pop,#clipboardPopup').addClass('popHide'); e.stop();
			})
		}
	},
	
	clean: function(html, options){
	
		options = $H({
			xhtml:false, 
			semantic:true, 
			remove:''
		}).extend(options);
		
		var br = '<br'+(xhtml?'/':'')+'>';
		var xhtml = [
			[/(<(?:img|input)[^\/>]*)>/g, '$1 />']									// Greyed out -  make img tags xhtml compatable 	#if (this.options.xhtml)
		];
		var semantic = [
			[/<li>\s*<div>(.+?)<\/div><\/li>/g, '<li>$1</li>'],						// remove divs from <li>		#if (Browser.Engine.trident)
			[/<span style="font-weight: bold;">(.*)<\/span>/gi, '<strong>$1</strong>'],	 			//
			[/<span style="font-style: italic;">(.*)<\/span>/gi, '<em>$1</em>'],					//
			[/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>'],									//
			[/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>'],											//
			[/<u\b[^>]*>(.*?)<\/u[^>]*>/gi, '<span style="text-decoration: underline;">$1</span>'],	//
			[/<p>[\s\n]*(<(?:ul|ol)>.*?<\/(?:ul|ol)>)(.*?)<\/p>/ig, '$1<p>$2</p>'], 				// <p> tags around a list will get moved to after the list.  not working properly in safari? #if (['gecko', 'presto', 'webkit'].contains(Browser.Engine.name))
			[/<\/(ol|ul)>\s*(?!<(?:p|ol|ul|img).*?>)((?:<[^>]*>)?\w.*)$/g, '</$1><p>$2</p>'],		// ''
			[/<br[^>]*><\/p>/g, '</p>'],											// Remove <br>'s that end a paragraph here.
			[/<p>\s*(<img[^>]+>)\s*<\/p>/ig, '$1\n'],				 				// If a <p> only contains <img>, remove the <p> tags	
			[/<p([^>]*)>(.*?)<\/p>(?!\n)/g, '<p$1>$2</p>\n'], 						// Break after paragraphs
			[/<\/(ul|ol|p)>(?!\n)/g, '</$1>\n'],	    							// Break after </p></ol></ul> tags
			[/><li>/g, '>\n\t<li>'],          										// Break and indent <li>
			[/([^\n])<\/(ol|ul)>/g, '$1\n</$2>'],    								// Break before </ol></ul> tags
			[/([^\n])<img/ig, '$1\n<img'],    										// Move images to their own line
			[/^\s*$/g, '']										        			// Delete empty lines in the source code (not working in opera)
		];
		var nonSemantic = [	
			[/\s*<br ?\/?>\s*<\/p>/gi, '</p>']										// if (!this.options.semantics) - Remove padded paragraphs
		];	
		var appleCleanup = [
			[/<br class\="webkit-block-placeholder">/gi, "<br />"],					// Webkit cleanup - add an if(webkit) check
			[/<span class="Apple-style-span">(.*)<\/span>/gi, '$1'],				// Webkit cleanup - should be corrected not to get messed over on nested spans - SG!!!
			[/ class="Apple-style-span"/gi, ''],									// Webkit cleanup
			[/<span style="">/gi, ''],												// Webkit cleanup	
			[/^([\w\s]+.*?)<div>/i, '<p>$1</p><div>'],								// remove stupid apple divs 	#if (Browser.Engine.webkit)
			[/<div>(.+?)<\/div>/ig, '<p>$1</p>']									// remove stupid apple divs 	#if (Browser.Engine.webkit)
		];
		var cleanup = [
			[/<br\s*\/?>/gi, br],													// Fix BRs, make it easier for next BR steps.
			[/><br\/?>/g, '>'],														// Remove (arguably) useless BRs
			[/^<br\/?>/g, ''],														// Remove leading BRs - perhaps combine with removing useless brs.
			[/<br\/?>$/g, ''],														// Remove trailing BRs
			[/<br\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1'],					// Remove BRs from end of blocks
			[/<p>\s*<br\/?>\s*<\/p>/gi, '<p>\u00a0</p>'],							// Remove padded paragraphs - replace with non breaking space
			[/<p>(&nbsp;|\s)*<\/p>/gi, '<p>\u00a0</p>'],							// ''
			[/<p>\W*<\/p>/g, ''],													// Remove ps with other stuff, may mess up some formatting.
			[/<\/p>\s*<\/p>/g, '</p>'],												// Remove empty <p> tags
			[/<[^> ]*/g, function(match){return match.toLowerCase();}],				// Replace uppercase element names with lowercase
			[/<[^>]*>/g, function(match){											// Replace uppercase attribute names with lowercase
			   match = match.replace(/ [^=]+=/g, function(match2){return match2.toLowerCase();});
			   return match;
			}],
			[/<[^>]*>/g, function(match){											// Put quotes around unquoted attributes
			   match = match.replace(/( [^=]+=)([^"][^ >]*)/g, "$1\"$2\"");
			   return match;
			}]
		];
		var depracated = [
			// The same except for BRs have had optional space removed
			[/<p>\s*<br ?\/?>\s*<\/p>/gi, '<p>\u00a0</p>'],							// modified as <br> is handled previously
			[/<br>/gi, "<br />"],													// Replace improper BRs if (this.options.xhtml) Handled at very beginning			
			[/<br ?\/?>$/gi, ''],													// Remove leading and trailing BRs
			[/^<br ?\/?>/gi, ''],													// Remove trailing BRs
			[/><br ?\/?>/gi,'>'],													// Remove useless BRs
			[/<br ?\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1'],					// Remove BRs right before the end of blocks
			//Handled with DOM:
			[/<p>(?:\s*)<p>/g, '<p>'],												// Remove empty <p> tags
		];
		
		var washer;
		if($type(html)=='element'){
			washer = html;
			html = washer.get('html');
			washer.moorte('remove');
		} else washer = $('washer') || new Element('div',{id:'washer'}).inject(document.body);

		washer.getElements('p:empty'+(options.remove ? ','+options.remove : '')).destroy();
		if(!Browser.Engine.gecko) washer.getElements('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) el.replaces(p)  });  // The following will not apply in Firefox, as it redraws the p's to surround the inner one with empty outer ones.  It should be tested for in other browsers. 
		html = washer.get('html');
		
		if(xhtml)cleanup.extend(xhtml);
		if(semantic)cleanup.extend(semantic);
		if(Browser.Engine.webkit)cleanup.extend(appleCleanup);

		var loopStop = 0;  //while testing.
		do{	
			var cleaned = html;
			cleanup.each(function(reg){ html = html.replace(reg[0], reg[1]); });		
		} while (cleaned != html && ++loopStop <3);
		html = html.trim();
		if(washer != $('washer')) washer.moorte();
		return html;
	}
}

Element.implement({
	moorte:function(directive, options){
		var bar = this.hasClass('MooRTE') ? this : this.retrieve('bar') || '';
		if($type(directive)=='object'){options = directive; directive = ''} 
		if(!directive || (directive == 'create')){
			/*
				console.log(options);	
				if(removed = this.retrieve('removed')){
					this.grab(removed, 'top');
					this.store('removed','');
				} else
			*/			
			return bar ? this.removeClass('rteHide') : new MooRTE($extend(options,{'elements':this}));
		}else{
			if(!bar) return false;
			else switch(directive.toLowerCase()){
				case 'hide': bar.addClass('rteHide'); break;
				case 'remove': this.store('removed', bar); new Element('span').replaces(bar).destroy();  break;
				case 'destroy': bar.retrieve('fields').each(function(el){el.removeEvents().store('bar','').contentEditable = false;}); bar.destroy(); break; 
			}
		}
	}
});

var upload;

MooRTE.Elements = new Hash({

	// Groups (Toolbars) - All groups should be created dynamically by the download builder.
	'Main'         :{text:'Main',   'class':'rteText', onClick:'onLoad', onLoad:['group',{Toolbar:['start','bold','italic','underline','strikethrough','Justify','Lists','Indents','subscript','superscript']}] },
	'File'         :{text:'File',   'class':'rteText', onClick:['group',{Toolbar:['start','cut','copy','paste','redo','undo','selectall','removeformat']}] },//
	'Font'         :{text:'Font',   'class':'rteText', onClick:['group',{Toolbar:['start','fontSize']}] },
	'Insert'       :{text:'Insert', 'class':'rteText', onClick:['group',{Toolbar:['start','popupURL','inserthorizontalrule']}] },//'Upload Photo','inserthorizontalrule']}] 
	'View'         :{text:'Views',  'class':'rteText', onClick:['group',{Toolbar:['start','Html/Text']}] },
	
	// Groups (Flyouts) - All groups should be created dynamically by the download builder.
	'Justify'      :{img:06, 'class':'Flyout rteSelected', contains:'div.Flyout:[justifyleft,justifycenter,justifyright,justifyfull]' },
	'Lists'        :{img:14, 'class':'Flyout', contains:'div.Flyout:[insertorderedlist,insertunorderedlist]' },
	'Indents'      :{img:11, 'class':'Flyout', contains:'div.Flyout:[indent,outdent]' },
	                
	// Buttons
	'div'          :{element:'div'},
	'bold'         :{img:1, shortcut:'b' },
	'italic'       :{img:2, shortcut:'i' },
	'underline'    :{img:3, shortcut:'u' },
	'strikethrough':{img:4},
	'justifyleft'  :{img:6, title:'Justify Left', onUpdate:function(cmd,val){var t = MooRTE.activeField.retrieve('bar').getElement('.rtejustify'+(val=='justify'?'full':val)); t.getParent().getParent().setStyle('background-position', t.addClass('rteSelected').getStyle('background-position'))  } },
	'justifyfull'  :{img:7, title:'Justify Full'  },
	'justifycenter':{img:8, title:'Justify Center'},
	'justifyright' :{img:9, title:'Justify Right' },
	'subscript'    :{img:18},
	'superscript'  :{img:17},
	'outdent'      :{img:11},
	'indent'       :{img:12},
	'insertorderedlist'  :{img:14, title:'Numbered List' },
	'insertunorderedlist':{img:15, title:'Bulleted List' },
	'copy'         :{img:21, title:'Copy (Ctrl+C)',  onClick:function(){ MooRTE.Elements.cut.onClick('copy');  }},
	'paste'        :{img:22, title:'Paste (Ctrl+V)', onClick:function(){ MooRTE.Elements.cut.onClick('paste'); }},
	'selectall'    :{img:25, title:'Select All (Ctrl + A)'},
	'removeformat' :{img:26, title:'Clear Formatting'},
	'undo'         :{img:31, title:'Undo (Ctrl + Z)' },
	'redo'         :{img:32, title:'Redo (Ctrl+Y)' },
	'decreasefontsize':{img:42},
	'increasefontsize':{img:41},	
	'inserthorizontalrule':{img:30, title:'Insert Horizontal Line' },
	'save'         :{ img:'11', src:'$root/moorte/plugins/save/saveFile.php', onClick:function(){
						var content = $H({ 'page': window.location.pathname });
						this.getParent('.MooRTE').retrieve('fields').each(function(el){
							content['content_'+(el.get('id')||'')] = MooRTE.Utilities.clean(el);
						});
						new Request({url:MooRTE.Elements.save.src}).send(content.toQueryString());
					}},
	'Html/Text'    :{ img:'26', onClick:['DisplayHTML']}, 
	'DisplayHTML'  :{ element:'textarea', 'class':'displayHtml', unselectable:'off', init:function(){ 
						var el=this.getParent('.MooRTE').retrieve('fields'), p = el.getParent(); 
						var size = (p.hasClass('rteTextArea') ? p : el).getSize(); 
						this.set({'styles':{width:size.x, height:size.y}, 'text':el.innerHTML.trim()})
					}},
	'colorpicker'  :{ 'element':'img', 'src':'images/colorPicker.jpg', 'class':'colorPicker', onClick:function(){
						//c[i] = ((hue - brightness) * saturation + brightness) * 255;  hue=angle of ColorWheel.  saturation =percent of radius, brightness = scrollWheel.
						//for(i=0;i<3;i++) c[i] = ((((h=Math.abs(++hue)) < 1 ? 1 : h > 2 ? 0 : -(h-2)) - brightness) * saturation + brightness) * 255;  
						//c[1] = -(c[2] - 255*saturation);var hex = c.rgbToHex();
						//var c, radius = this.getSize().x/2, x = mouse.x - radius, y = mouse.y - radius, brightness = hue.y / hue.getSize().y, hue = Math.atan2(x,y)/Math.PI * 3 - 2, saturation = Math.sqrt(x*x+y*y) / radius;
						var c, radius = this.getSize().x/2, x = mouse.x - radius, y = mouse.y - radius, brightness = hue.y / hue.getSize().y, hue = Math.atan2(x,y)/Math.PI * 3 + 1, saturation = Math.sqrt(x*x+y*y) / radius;
						for(var i=0;i<3;i++) c[i] = (((Math.abs((hue+=2)%6 - 3) < 1 ? 1 : h > 2 ? 0 : -(h-2)) - brightness) * saturation + brightness) * 255;  
						var hex = [c[0],c[2],c[1]].rgbToHex();
					}},
	'cut'          :{img:20,  title:'Cut (Ctrl+X)', 
						onClick:function(action){ Browser.Engine.gecko ? $$('#pop,#clipboardPopup').removeClass('popHide') : MooRTE.Utilities.exec(action); },
						onLoad:function(){ 
							if (Browser.Engine.gecko) 
								console.log('cut func called');
								new Loader({
									scripts: [MooRTE.path+'plugins/Popup/Popup.js'], 
									styles:[MooRTE.path+'plugins/Popup/Popup.css'], 
									onComplete:function(){
										console.log('cut OnComplete called');
										var html = "For your protection, Firefox does not allow access to the clipboard.<br/>  <b>Please use Ctrl+C to copy, Ctrl+X to cut, and Ctrl+V to paste.</b><br/>\
													(Those lucky enough to be on a Mac use Cmd instead of Ctrl.)<br/><br/>\
													If this functionality is important, consider switching to a less secure browser such as IE,<br/> which will allow us to easily access [and modify] your system.\
													<div class='btns'><input id='pCutCopyCancel' type='submit' value='OK'/></div>"; 
										new Popup('clipboardPopup', html, 'Security Restriction').getElement('#pCutCopyCancel').addEvent('click', function(e){
											Popup.hide(); e.stop();
										});
										Popup.hide(); 
									} 
								});
						}
					},
	'popupURL'     :{ img:46, title:'Create hyperlink', 
						onClick:function(){
							MooRTE.Utilities.storeRange();
							$$('#pop,#popupURL').removeClass('popHide');
							$('popTXT').set('value',MooRTE.ranges.a1);
						},
						onLoad:function(){
							new Loader({
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
										MooRTE.Utilities.setRange();												//MooRTE.activeBar.retrieve('ranges').set();
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
	'Upload Photo' :{ img:15, 
						onLoad:function(){
							new Loader({
								scripts: ['/siteroller/classes/fancyupload/fancyupload/source/Swiff.Uploader.js'], 
								styles: ['/siteroller/classes/fancyupload/fancyupload/source/Swiff.Uploader.css'], 
								onComplete:function(){
									var uploader = new Swiff.Uploader({ //verbose: true, 
										target:this, queued: false, multiple: false, instantStart: true, fieldName:'photoupload', 
										typeFilter: { 'Images (*.jpg, *.jpeg, *.gif, *.png)': '*.jpg; *.jpeg; *.gif; *.png'	},
										path: '/siteroller/classes/fancyupload/fancyupload/source/Swiff.Uploader.swf',
										url: '/siteroller/classes/moorte/moorte/plugins/fancyUpload/uploadHandler.php',
										onButtonDown :function(){ MooRTE.Utilities.setRange() },
										onButtonEnter :function(){ MooRTE.Utilities.storeRange() },
										onFileProgress: function(val){  },//self.set('text',val);
										onFileComplete: function(args){ MooRTE.Utilities.setRange().exec('insertimage',JSON.decode(args.response.text).file) }
									});
									this.addEvent('mouseenter',function(){ uploader.target = this; uploader.reposition(); })
								}
							})
						}							
					},

//depracated
	'Menu'         :{element:'div'},  //div.Menu would create the same div (with a class of rteMenu).  But since it is the default, I dont wish to confuse people...
	'Toolbar'      :{element:'div'},  // ''
	'unlink'       :{img:'6'},
	'start'        :{element:'span'},
	'|'            :{text:'|', title:'', element:'span'},
	'Link'         :{img:40, onClick:{Toolbar:['l0','l1','l2','unlink']} },
	'l0'           :{'text':'enter the url', element:'span' },
	'l1'           :{'type':'text',  'onClick':MooRTE.Utilities.storeRange }, 
	'l2'           :{'type':'submit', events:{'mousedown':function(e){e.stopPropagation();}, 'onClick':function(e){ MooRTE.Utilities.setRange(); MooRTE.Utilities.exec('createlink',this.getPrevious().get('value')); e.stop()}}, 'value':'add link' },
	'nolink'       :{'text':'please select the text to be made into a link'},
	'remoteURL'    :{onClick:['imgSelect','imgInput','insertimage']},
	'imgSelect'    :{element:'span', text:'URL of image' },
	'imgInput'     :{type:'text' },
	'insertimage'  :{onClick:function(args, classRef){ 
						classRef.exec([this.getParent().getElement('input[type=text]').get('text')]) 
					}},
	'cut-old'          :{img:20,  title:'Cut (Ctrl+X)', onLoad:['assetLoader', 'Popup','plugins/Popup/','Popup.js','Popup.css',$empty], onClick:function(action){	
							if (Browser.Engine.gecko){
								if($('popupCutCopy')) $$('#pop,#popupCutCopy').removeClass('popHide');
								else{
									var html = "For your protection, Firefox does not allow access to the clipboard.<br/>  <b>Please use Ctrl+C to copy, Ctrl+X to cut, and Ctrl+V to paste.</b><br/>\
												(Those lucky enough to be on a Mac use Cmd instead of Ctrl.)<br/><br/>\
												If this functionality is important, consider switching to a less secure browser such as IE,<br/> which will allow us to easily access [and modify] your system.\
												<div class='btns'><input id='pCutCopyCancel' type='submit' value='OK'/></div>"; 
									new Popup('popupCutCopy', html, 'Security Restriction').getElement('#pCutCopyCancel').addEvent('click', function(e){
										$$('#pop,#popupCutCopy').addClass('popHide'); e.stop();
									})
								}
							} else MooRTE.Utilities.exec(action); 
						}
					},
	'save-old'     :{ img:'11', src:'$root/moorte/plugins/save/saveFile.php', onClick:function(){
						var content = $H({ 'page': window.location.pathname });
						this.getParent('.MooRTE').retrieve('fields').each(function(el){
							content['content_'+(el.get('id')||'')] = MooRTE.Utilities.clean(el);
						});
						new Request({url:MooRTE.Elements.save.src}).send(content.toQueryString());
					}},
	'popupURL-old'     :{ img:'8', onLoad:['assetLoader', 'Popup','plugins/Popup/','Popup.js','Popup.css',$empty], onClick:function(){
							MooRTE.Utilities.storeRange();
							var pop = $('pop');
							if(pop) pop.removeClass('popHide');
							else{
								var html = "<span>Text of Link:</span><input type='text' id='popTXT'/><br/>\
									<span>Link to:</span><input type='text' id='popURL'/><br/>\
									<div class='radio'> <input type='radio' name='pURL' value='web' checked/>Web<input type='radio' name='pURL' value='email'/>Email</div>\
									<div class='btns'><input id='purlOK' type='submit' value='OK'/><input id='purlCancel' type='submit' value='Cancel'/></div>";
								
								pop = new Popup('popupURL', html, 'Edit Link');
								pop.getElement('#purlOK').addEvent('click', function(e){
									MooRTE.Utilities.setRange();		//MooRTE.activeBar.retrieve('ranges').set();
									var value = pop.getElementById('popURL').get('value');
									MooRTE.Utilities.exec(value ? 'createlink' : 'unlink', value); 
									$('pop').addClass('popHide'); e.stop();
									e.stop(); 
								})
								pop.getElement('#purlCancel').addEvent('click', function(e){
									$('pop').addClass('popHide'); e.stop();
								})
							}
							$('popTXT').set('value',MooRTE.ranges.a1);
						} 
					},
	'Upload Photo-old' :{ img:15, events:{ mouseenter:function(){ uploader.target = this; uploader.reposition(); }},
						onLoad:['assetLoader','Swiff.Uploader','../../fancyupload/fancyupload/source/', 'Swiff.Uploader.js','Swiff.Uploader.css', function(){
							uploader = new Swiff.Uploader({ 
								verbose: true, target:this, queued: false, multiple: false, instantStart: true, 
								typeFilter: { 'Images (*.jpg, *.jpeg, *.gif, *.png)': '*.jpg; *.jpeg; *.gif; *.png'	},
								path: '../../fancyupload/fancyupload/source/Swiff.Uploader.swf',
								url: '/siteRoller/siteroller/classes/moorte/moorte/plugins/fancyUpload/uploadHandler.php',
								fileProgress: function(val){ this.set('txt',val); } 
							});
						}]
					}
	
	
});