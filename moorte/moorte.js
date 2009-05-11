/* Copyright November 2008, Sam Goody, ssgoodman@gmail.com 
*   Licensed under the Open Source License
*
* 	Authors:		
*		Sam Goody (ssgoodman@gmail.com)
*		Mark Kohen
*		T. Anolik
*	Credits:
*	Entirely based on the tutorial at: http://dev.opera.com/articles/view/rich-html-editing-in-the-browser-part-1.  Great job, Olav!!
*	Ideas and inspiration: Guillerr, MooEditable
*	Icons from OpenWysiwyg - http://www.openwebware.com
*	Many of the cleanup regexs from CheeAun and Ryan's work on MooEditable
*	We really want your help!  Please join!!
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
		if(!MooRTE.activeField)
			MooRTE.extend({update:{value:$H({}), state:$H({}), custom:$H({})}, ranges:$H({}), removed:$H({}), shortcuts:$H({}), activeField:'', activeBtn:'', activeBar:'' });
		
		els.each(function(el){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = self.textArea(el);
			if(l=='e' || !rte) rte = self.insertToolbar(l);  						//[L]ocation == elem[e]nts. [Creates bar if none or, when 'elements', for each element]
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
		
		//MooRTE.activeBar = (MooRTE.activeField = els[0]).retrieve('bar');								//in case a button is pressed before anything is selected.
		els[0].fireEvent('focus');//,els[0]
		if(l=='t') rte.addClass('rtePageTop').getFirst().addClass('rteTopDown');
		else if(l=='b') rte.addClass('rtePageBottom');
		MooRTE.Utilities.exec('styleWithCSS');
	},
	
	insertToolbar: function (pos){
		self = this;
		var rte = new Element('div', {'class':'rteRemove MooRTE '+(!pos||pos=='n'?'rteHide':''), 'contentEditable':false }).adopt(
			 new Element('div', {'class':'RTE '+self.options.skin })
		).inject(document.body);
		MooRTE.activeBar = rte; // not used!
		MooRTE.Utilities.addElements(this.options.buttons, rte.getFirst(), 'bottom', 'rteGroup_Auto')
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
})

MooRTE.Utilities = {
	exec: function(args){
		args = $A(arguments).flatten(); 											// args can be an array (for the hash), or regular arguments(elsewhere).
		var g = (Browser.Engine.gecko && 'ju,in,ou'.contains(args[0].substr(0,2).toLowerCase()));	//Fix for FF3 bug for justify, in&outdent
		if(g) document.designMode = 'on';
		document.execCommand(args[0], args[2]||null, args[1]||false);				//document.execCommand('justifyright', false, null);//document.execCommand('createlink', false, 'http://www.google.com');
		if(g) document.designMode = 'off';
	},
	
	storeRange:function(rangeName){
		var sel = window.getSelection ? window.getSelection() : window.document.selection;
		if (!sel) return null;
		MooRTE.ranges[rangeName || 1] = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
	},
	
	setRange: function(rangeName) {
		var range = MooRTE.ranges[rangeName || 1]
		if(range.select) range.select(); 
		else{	
			var sel = window.getSelection ? window.getSelection() : window.document.selection;
			if (sel.addRange){
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
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
			else window.document.queryCommandState(vals[0]) ? vals[1].addClass('rteSelected') : vals[1].removeClass('rteSelected');
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
			buttons = buttons.replace(/'([^']*)'|"([^"]*)"|([^{}:,\][\s]+)/gm, "'$1$2$3'"); 					// surround strings with single quotes.  Convert double to single quoutes. 
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
			var btnVals;
			if ($type(btn)=='object'){btnVals = Hash.getValues(btn)[0]; btn = Hash.getKeys(btn)[0];}
			[btn,btnClass] = btn.split('.');
			var e = parent.getElement('[class~='+name+']'||'.rte'+btn);
			
			if(!e){
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
							MooRTE.Utilities.run(val, 'onClick', this, btn)
							if(e && e.stop) input || textarea ? e.stopPropagation() : e.stop();					//if input accept events, which means keeping it from propogating to the stop of the parent!!
						}
					}
				}).extend(val);
				['args','shortcut','element','onClick','img','onLoad','onExpand','onHide','onShow','onUpdate',(val.element?'href':'null'),(Browser.Engine.trident?'':'unselectable')].map(properties.erase.bind(properties));
				e = new Element((input && !val.element ? 'input' : val.element||'a'), properties.getClean()).inject(place,relative||'bottom').addClass((name||'')+' rte'+btn + (btnClass ? ' rte'+btnClass : ''));
					
				if(val.onUpdate || state) 
					parent.retrieve('update', $H({'value':[], 'state':[], 'custom':[] }))[
						'fontname,fontsize,backcolor,forecolor,hilitecolor,justifyleft,justifyright,justifycenter,'.contains(btn.toLowerCase()+',') ? 
						'value' : (state ? 'state' : 'custom')
					].push([btn, e, val.onUpdate]);
			
				if (val.shortcut) parent.store('shortcuts', parent.retrieve('shortcuts',$H({})).set(val.shortcut,btn)); //Can this be shortened? 
				MooRTE.Utilities.run(val, 'onLoad', e, btn);
				if (btnVals) MooRTE.Utilities.addElements(btnVals, e);
				else if (val.contains) MooRTE.Utilities.addElements(val.contains, e);
				//if (collection.getCoordinates().top < 0)toolbar.addClass('rteTopDown'); //untested!!
			}
			e.removeClass('rteHide')
		})
	},
	
	run: function(val, prop, caller, name){
		if(!(prop = val[prop])) return;
		var args = val['args']; //Deprecated!
		switch($type(prop)){
			case 'function': prop.bind(caller)(args); return;
			case 'string': 
				'onLoad,onClick,onInit,'.contains(prop+',') ? MooRTE.Utilities.run(val, prop, caller, name)
				: MooRTE.Utilities[prop] ? MooRTE.Utilities[prop].bind(caller)(args)			//case 'exec, clean'
				: MooRTE.Utilities.add(val, prop, caller, name); 								//case 'toolbar:[bold]'
			break;
			default: MooRTE.Utilities.add(val, prop, caller, name); break;						//case 'object': case 'array', which will be made into a new toolbar!
		}
	},
	
	add: function(val, prop, caller, name){
		var el, parent = caller.getParent('.RTE');;
		(val.hides||caller.getSiblings('*[class*=rteAdd]')).each(function(el){ 
			el.removeClass('rteSelected');
			parent.getFirst('.rteGroup_'+(el.get('class').match(/rteAdd([^ ]+?)\b/)[1])).addClass('rteHide');	//In the siteroller php selector engine, one can get a class that begins with a string by combining characters - caller.getSiblings('[class~^=rteAdd]').  Unfortunately, Moo does not support this!
			MooRTE.Utilities.run(val, 'onHide', caller, name);
		});
		caller.addClass('rteSelected rteAdd'+name);
		MooRTE.Utilities.addElements(prop, caller.getParent('[class*=rteGroup_]'), 'after', 'rteGroup_'+name);
		MooRTE.Utilities.run(val,'onShow',caller, name);	
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
	//$$('div.RTE')[0].moorte();
	moorte:function(directive, options){
		var bar = this.hasClass('MooRTE') ? this : this.retrieve('bar') || '';
		if(!directive || (directive == 'create')){
			if(removed = this.retrieve('removed')){
				this.grab(removed, 'top');
				this.store('removed','');
			} else return bar ? this.removeClass('rteHide') : new MooRTE(this, options);
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

MooRTE.Elements = new Hash({

	'Main'         :{text:'Main',   'class':'rteText', onClick:'onLoad', onLoad:{Toolbar:['start','bold','italic','underline','strikethrough','Justify','Lists','Indents','subscript','superscript']} },
	'File'         :{text:'File',   'class':'rteText', onClick:{Toolbar:['start','cut','copy','paste','redo','undo','selectall','removeformat']} },
	'Font'         :{text:'Font',   'class':'rteText', onClick:{Toolbar:['start','fontSize']} },
	'Insert'       :{text:'Insert', 'class':'rteText', onClick:{Toolbar:['start','Link','fuUploadBar','inserthorizontalrule']} },
	'View'         :{text:'Views',  'class':'rteText', onClick:{Toolbar:['start','Html/Text']} },
	
	'Justify'      :{img:'36', 'class':'Flyout rteSelected', contains:'div.Flyout:[justifyleft,justifycenter,justifyright,justifyfull]' },
	'Lists'        :{img:'41', 'class':'Flyout', contains:'div.Flyout:[insertorderedlist,insertunorderedlist]' },
	'Indents'      :{img:'40', 'class':'Flyout', contains:'div.Flyout:[indent,outdent]' },
	'Link'         :{img: '8', onClick:{Toolbar:['l0','l1','l2','unlink']} },
	
	'div'          :{element:'div'},
	'Menu'         :{element:'div'},  //div.Menu would create the same div (with a class of rteMenu).  But since it is the default, I dont wish to confuse people...
	'Toolbar'      :{element:'div'},  // ''
	'start'        :{element:'span'},
	
	'|'            :{text:'|', title:'', element:'span'},
	'bold'         :{img:'1', shortcut:'b' },
	'italic'       :{img:'33', shortcut:'i' },
	'underline'    :{img:'32', shortcut:'u' },
	'strikethrough':{img:'34'},
	'subscript'    :{img:'43'},
	'superscript'  :{img:'44'},
	'indent'       :{img:'40'},
	'outdent'      :{img:'39'},
	'paste'        :{img:'9',  title:'Paste (Ctrl+V)'},
	'copy'         :{img:'4',  title:'Copy (Ctrl+C)'},
	'cut'          :{img:'5',  title:'Cut (Ctrl+X)'},
	'redo'         :{img:'12', title:'Redo (Ctrl+Y)' },
	'undo'         :{img:'11', title:'Undo (Ctrl + Z)' },
	'justifyleft'  :{img:'35', title:'Justify Left', onUpdate:function(cmd,val){var t = MooRTE.activeField.retrieve('bar').getElement('.rtejustify'+(val=='justify'?'full':val)); t.getParent().getParent().setStyle('background-position', t.addClass('rteSelected').getStyle('background-position'))  } },
	'justifycenter':{img:'37', title:'Justify Center'},
	'justifyright' :{img:'38', title:'Justify Right' },
	'justifyfull'  :{img:'36', title:'Justify Full'  },
	'insertorderedlist'  :{img:'41', title:'Numbered List' },
	'insertunorderedlist':{img:'42', title:'Bulleted List' },
	'test'         :{onClick:function(){console.log(arguments)}, args:this},
	'l0'           :{'text':'enter the url', element:'span' },
	'l1'           :{'type':'text',  'onClick':MooRTE.Utilities.storeRange }, 
	'l2'           :{'type':'submit', events:{'mousedown':function(e){e.stopPropagation();}, 'onClick':function(e){ MooRTE.Utilities.setRange(); MooRTE.Utilities.exec('createlink',this.getPrevious().get('value')); e.stop()}}, 'value':'add link' },
	'nolink'       :{'text':'please select the text to be made into a link'},
	'unlink'       :{img:'6'},
	'remoteURL'    :{onClick:['imgSelect','imgInput','insertimage']},
	'imgSelect'    :{element:'span', text:'URL of image' },
	'imgInput'     :{type:'text' },
	'insertimage'  :{onClick:function(args, classRef){ 
						classRef.exec([this.getParent().getElement('input[type=text]').get('text')]) 
					}},
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
						var c, radius = this.getSize().x/2, x = mouse.x - radius, y = mouse.y - radius, brightness = hue.y / hue.getSize().y, hue = Math.atan2(x,y)/Math.PI * 3 - 2, saturation = Math.sqrt(x*x+y*y) / radius;
						for(i=0;i<3;i++) c[i] = ((((h=Math.abs(++hue)) < 1 ? 1 : h > 2 ? 0 : -(h-2)) - brightness) * saturation + brightness) * 255;  
						c[1] = -(c[2] - 255*saturation);
						var hex = c.rgbToHex();
					}},
	'fuUploadBar'  :{ title:'Upload Image', img:15, onClick:'Toolbar:[fuBrowse,fuUpload,fuClear,fuStatus,fuList]'},
	'fuBrowse'     :{ id:"fuBrowse", element:'span', text:'Browse Files', title:''},
	'fuUpload'     :{ id:"fuUpload", onClick:'', element:'span', text:'Upload Files', title:''},
	'fuClear'      :{ id:"fuClear", element:'span', text:'Clear List' ,title:''},	
	'fuStatus'     :{ element:'span', id:'fuStatus', contains:'[fu1,fu2,fu3,fu4,fu5]'},
	'fu1'          :{ element:'strong', 'class':'overall-title'},
	'fu2'          :{ element:'strong', 'class':'current-title'},
	'fu3'          :{ element:'div',    'class':'current-text' },
	'fu4'          :{ element:'img',    'class':'progress overall-progress', src:'moorte/plugins/fancyUpload/assets/progress-bar/bar.gif' },
	'fu5'          :{ element:'img',    'class':'progress current-progress', src:'moorte/plugins/fancyUpload/assets/progress-bar/bar.gif' },
	'fuList'       :{ id:'fuList', style:'display:none', onInit:function(){
						var path = new URI($$('script[src*=moorte.js]')[0].get('src')).get('directory')+'plugins/fancyUpload/fancyUpload';
						Asset.javascript(path+'.js');
						Asset.css(path+'.css');
					}},
	'fuPhotoUpload':{ id:'demo-photoupload', element:'input', type:'file', name:'photoupload' },
	'loading..'    :{ 'class':'rteLoading', 	element:'span', text:'loading...',title:''},
	
	//untested:
	'decreasefontsize':{img:'29'},
	'increasefontsize':{img:'29'},
	'inserthorizontalrule':{img:'30'},
	'removeformat' :{img:'26', title:'Clear Formatting'},
	'selectall'    :{img:'27', title:'Select All (Ctrl + A)'},
	
	//unused:
	'Defaults'     :{onLoad:{Toolbar:['Main','File','Link','Lists','Indents','|','Html/Text','fuUploadBar']}},	//group - defaults
	'JustifyBar'   :{img:'18', onClick:'Flyout:[justifyleft,justifycenter,justifyright,justifyfull]' },
	'l2old'         :{'type':'submit', 'onClick':function(){ MooRTE.Utilities.setRange(); MooRTE.Utilities.exec('createlink',this.getPrevious().get('value'))}, 'value':'add link' }
});