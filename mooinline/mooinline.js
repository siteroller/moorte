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

var MooInline = new Class({
	
	Implements: [Options],

	options:{
		floating: false,
		location: 'elements', 														//[e,n,T,B,'']
		defaults: 'Defaults'
	},
	
	initialize: function(selectors, options){
		this.setOptions(options);	
		var self = this, mi, els = $$(selectors||'textarea, .RTE'), l = this.options.location.substr(4,1).toLowerCase();
		MooInline.shortcuts = MooInline.shortcutBtns = MooInline.activeField = MooInline.activeBtn = [];
		
		els.each(function(el, index){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = self.textArea(el);
			if(l=='e' || !mi) mi = self.insertToolbar(l);  							//[L]ocation == elem[e]nts. [Creates bar if none or, when 'elements', for each element]
			if(l=='b' || l=='t' || !l) el.set('contentEditable', true).focus();		//[L]ocation == page[t]op, page[b]ottom, none[] 
			else l=='e' ? self.positionToolbar(el,mi) : el.addEvents({				//[L]ocation == elem[e]nts ? inli[n]e
				'click': function(){ self.positionToolbar(el, mi); },
				'blur':function(){ 
					mi.addClass('miHide'); this.set('contentEditable', false);	
				}
			});
			el.store('bar', mi).addEvents({
				'mouseup':MooInline.Utilities.updateBtns, 
				'keydown':MooInline.Utilities.updateBtns, 
				'focus':function(){ MooInline.bar = this.retrieve('bar'); }
			});
		})
		MooInline.Utilities.activeField = els[0];									//in case a button is pressed before anything is selected.
		if(l=='t') mi.addClass('miPageTop').getFirst().addClass('miTopDown');
		else if(l=='b') mi.addClass('miPageBottom');
	},
	
	insertToolbar: function (pos){
		var mi = new Element('div', {'class':'miRemove miMooInline '+(!pos||pos=='n'?'miHide':''), 'contentEditable':false }).adopt(
			 new Element('div', {'class':'miRTE' })
		).inject(document.body);
		$splat(this.options.defaults).map(function(i){return i.split(',')}).each(
			function(buttons, index){
				MooInline.activeBtn = mi.getFirst();
				MooInline.Utilities.addCollection(buttons, mi.getFirst(), 'bottom', '', [], 0)
			}//buttons,[mi.getFirst(), 'bottom', 'Top'], 0, []
		);

		return mi;
	},
	
	positionToolbar: function (el, mi){												//function is sloppy.  Clean!
		el.set('contentEditable', true).focus();
		var elSize = el.getCoordinates(), f=this.options.floating;
		mi.removeClass('miHide').setStyle('width',elSize.width).store('field', mi.retrieve('field', []).include(el));
		if(f) mi.setStyles({ 'left':elSize.left, 'top':(elSize.top - mi.getFirst().getCoordinates().height > 0 ? elSize.top : elSize.bottom) }).addClass('miFloat').getFirst().addClass('miFloat');
		else mi.inject((el.getParent().hasClass('miTextArea')?el.getParent():el),'before');
	},
	
	textArea: function (el){
		var div = new Element('div', {text:el.get('value')});
		new Element('div', {'class':'miTextArea '+el.get('class'), 'styles':el.getCoordinates() }).adopt(div, new Element('span')).setStyle('overflow','auto').inject(el, 'before');
		el.addClass('miHide');
		return div;
	}
})

MooInline.Utilities = {
	exec: function(args){
		args = $splat(args);
		var g = (Browser.Engine.gecko && 'ju,in,ou'.contains(args[0].substr(0,2).toLowerCase()));	//Fix for FF3 bug for justify, in&outdent
		if(g) document.designMode = 'on';
		document.execCommand(args[0], args[2]||false, args[1]||null);  				//document.execCommand('justifyRight', false, null);
		if(g) document.designMode = 'off'
	},
	
	getRange:function(){
		if(miRangeSelection != 'undefined') console.log( 1 )
		var sel = window.getSelection ? window.getSelection() : window.document.selection;
		if (!sel) return null;
		this.range = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
	},
	
	setRange: function() {
		if(this.range.select) this.range.select(); 
		else{
			var sel = window.getSelection ? window.getSelection() : window.document.selection;
			miRangeSelection = sel;
			if (sel.addRange){
				sel.removeAllRanges();
				sel.addRange(this.range);
			}
		}
 
		var url = $('miLink').get('value') || "";
		MooInline.utilities.exec(['createlink',url]);
		//var url = window.prompt("Enter an URL:", "."); document.execCommand('createlink', false, url);
	},
	
	updateBtns: function(e){
return	
	var bar = MooInline.bar, be, btn;
		console.log(bar);
		var vv = [	'bold','italic','underline','strikethrough','subscript','superscript','justifyleft','justifycenter',
			'JustifyRight','justifyfull','insertorderedlist','insertunorderedlist','unlink'
		]
		vv.each(function(prop){		
				if (be = bar.getElement('.mi'+prop))
					window.document.queryCommandState(prop) ? be.addClass('miSelected') : be.removeClass('miSelected');
		})
		[''].each(function(prop){	
			if (be = bar.getElement('.mi'+prop))
				window.document.queryCommandValue(prop) ? be.addClass('miSelected') : be.removeClass('miSelected');
		}) 
		if(e && e.control && (btn = MooInline.shortcuts.indexOf(e.key))>-1){ 
			e.stop(); 
			btn = bar.getElement('.mi'+t.shortcutBtns[btn])
			btn.fireEvent('mousedown', btn)
		}
	},
	
	addCollection: function(buttons, place, relative, name, hides, invisible){
		//div.MooInline[absPos. height:0] > div.miRTE[absPos height:auto] > custom elements
		function run(prop, args, self, hides){
			if(!prop) return;
			console.log('hides: ',hides);
			switch($type(prop)){
				case 'function':prop.bind(self)(args); return; 
				case 'string': MooInline.Utilities[prop].bind(self)(args); break;
				//default: MooInline.Utilities.addCollection(prop, self, 0, hides); break; //case 'object': case 'array'
				default: MooInline.Utilities.addCollection(prop, self, 'bottom', hides, 0); break; //case 'object': case 'array'
			}
		}
		
		if(!hides) hides = '';
		if(!place) place = MooInline.activeBtn.getParent('.miRTE');
		console.log(place, 'place')
		if(!name ) name = Hash.toQueryString(buttons);//.exec(/(\w)*/);
		console.log(name, 'name');
		console.log($type(name), 'nameType')
		console.log(name.match(/\w/g), 'nameMatch')
		
		var self = this, collection = place.getElement('.'+name), btns = [], img, args;
		buttons = $splat(buttons);
		
		buttons.each(function(item){
			switch($type(item)){
				case 'string': btns.push(item); break;
				case 'array' : item.each(function(val){btns.push(val)}); break;	//item.each(buttons.push);
				case 'object': Hash.each(item, function(val,key){var newObj = {}; newObj[key] = val; btns.push(newObj)}); break;			
			}
		})
		buttons = $A(btns);
		
		console.log(buttons, 'buttons')
		//console.log(buttons, 'buttons')
		//console.log(buttons, 'buttons')
		//console.log(item, ': item')
		//should it pass in a ref to the caller if available, and collect from there the parent and group.
		//if ($type(place) == 'element') place = [place.getParent(),'after', place.get('class').match(/mi(?!Selection)[^\s]+/)[0]];
		//var self = this, collection = place[0].getParent().getElement('.miCollection_'+place[2]), img, args;
		
		if(!collection){
	//console.log(name, 'co0llection');
		//if(!collection){
			//collection = new Element('div', {'class':'miCollection_'+(place[2]||Math.random())}).inject(place[0], place[1]);
			//collection = new Element('div', {'class':name}).inject(place, relative||'bottom');
			buttons.each(function(btn){
				
				console.log('btn: ',btn)
				var btnVals;
				if ($type(btn)=='object'){btnVals = Hash.getValues(btn)[0]; btn = Hash.getKeys(btn)[0];}
				var bgPos = 0, val = MooInline.Buttons[btn], input = 'text,password,submit,button,checkbox,file,hidden,image,radio,reset'.contains(val.type);
				if(!isNaN(val.img)){ bgPos = val.img; img = 'mooinline/images/i.gif' };						//if number, image is assumed to be default, position is number

				var properties = $H({
					href:'javascript:void(0)',
					unselectable: (input ? 'off' : 'on'),
					'class':'mi'+(val.title||btn),															//Will apply the first that exists: mi + [class, title, key] 
					title: btn + (val.shortcut ? ' (Ctrl+'+val.shortcut.capitalize()+')':''),	
					styles:img ? {'background-image':'url('+img+')', 'background-position':(-2+-18*bgPos)+'px -2px'}:'',
					events:{
						'mousedown': function(e){
							MooInline.activeBtn = this;
							if(!val.click && (!val.element || val.element == 'a')) MooInline.Utilities.exec(args||btn);
							run(val.click, val.args, this, buttons)
							if(e && e.stop)e.stop();
							
							this.getParent().getChildren().removeClass('miSelected');
							if(!val.ignoreState)this.addClass('miSelected');
						}
					}
				}).extend(val);
				['args','shortcut','element','click','img','onLoad','onExpand','onHide',(val.element?'href':'null')].map(properties.erase.bind(properties));
				console.log(properties);
				var e = new Element((input && !val.element ? 'input' : val.element||'a'), properties.getClean()).inject(place,relative||'bottom');
				
				run(val.onLoad, val.args, place, [])	
				if(val.shortcut){MooInline.shortcuts.include(val.shortcut); MooInline.shortcutBtns.include(btn);} 
				console.log(btnVals, 'btnvals')
				if (btnVals) MooInline.Utilities.addCollection(btnVals);//lots to work out still.
				if(collection.getCoordinates().top < 0)toolbar.addClass('miTopDown'); //untested!!
			})
		}
		var par = collection.getParent('.miRTE');
		for(i=0; i<group.length; i++){
			var el = par.getElement('.miCollection_mi'+group[i]);
			if(el)el.addClass('miHide')
		}
		if(!invisible)collection.removeClass('miHide')
	},
	
	clean: function(html, xhtml, semantic){
		
		$$('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) $el.replaces(p)  });
		//$$('br:last-child').each(function(el){ if(!el.nextSibling && 'h1h2h3h4h5h6lip'.contains(el.getParent().get('tag'))) el.destroy(); });		//$$('br:last-child').filter(function(el) { return !el.nextSibling; })
	
		var br = '<br'+(xhtml?'/':'')+'>';
		var xhtml = [
			//[/(<(?:img|input|br)[^/>]*)>/g, '$1 />'] 					// if (this.options.xhtml)//make tags xhtml compatable
		];
		var semantic = [
			[/<li>\s*<div>(.+?)<\/div><\/li>/g, '<li>$1</li>'],			//remove divs from <li>
			[/^([\w\s]+.*?)<div>/i, '<p>$1</p><div>'],					//remove stupid apple divs
			[/<div>(.+?)<\/div>/ig, '<p>$1</p>'],
			[/<span style="font-weight: bold;">(.*)<\/span>/gi, '<strong>$1</strong>'],	// Semantic conversion.  Should be separate array that is merged in if semantic is set to true.
			[/<span style="font-style: italic;">(.*)<\/span>/gi, '<em>$1</em>'],
			[/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>'],
			[/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>'],
			[/<u\b[^>]*>(.*?)<\/u[^>]*>/gi, '<span style="text-decoration: underline;">$1</span>']
		];
		var cleanup = [
			[/<br class\="webkit-block-placeholder">/gi, "<br />"],		// Webkit cleanup
			[/<span class="Apple-style-span">(.*)<\/span>/gi, '$1'],	// should be corrected, not to get messed over on nested spans - SG!!!
			[/ class="Apple-style-span"/gi, ''],
			[/<span style="">/gi, ''],
			[/<br\s*\/?>/gi, br],										// Fix BRs, make it easier for next BR steps.
			[/><br\/?>/g, '>'],											// Remove (arguably) useless BRs
			[/^<br\/?>/g, ''],											// Remove leading BRs - perhaps combine with removing useless brs.
			[/<br\/?>$/g, ''],											// Remove leading BRs
			[/<br\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1'],		// Remove BRs from end of blocks
			[/<p>\s*<br\/?>\s*<\/p>/gi, '<p>\u00a0</p>'],				// Remove padded paragraphs - replace with non breaking space
			[/<p>(&nbsp;|\s)*<\/p>/gi, '<p>\u00a0</p>'],
			[/<p>\W*<\/p>/g, ''],										// Remove ps with other stuff, may mess up some formatting.
		];
		if(xhtml)cleanup.extend(xhtml);
		if(semantic)cleanup.extend(semantic);
		cleanup.each(function(reg){ html = html.replace(reg[0], reg[1]); });
		return source;
	}
}


MooInline.Buttons = new Hash({

	'Defaults'     :{onLoad:{toolbar:['Main','File','Link','Justify','Lists','Indents','|','Html/Text','fuUploadBar']}},	//group - defaults
	'Main'         :{img: '0', click:['bold','italic','underline','strikethrough','subscript','superscript'] },//console.log()//group - 'Main','File','Link','Justify','Lists','Indents','|','Html/Text','fuUploadBar'
	'File'         :{img: '9', click:['paste','copy','cut','redo','undo'] },
	'Link'         :{img: '6', click:['l0','l1','l2','unlink'],  checkState:true},
	'Justify'      :{img:'18', click:{toolbar:['justifyleft','justifycenter','JustifyRight','justifyfull']} },
	'Lists'        :{img:'22', click:['insertorderedlist','insertunorderedlist'] },
	'Indents'      :{img:'16', click:['indent','outdent'] },//, init:function(){ console.log(this); this.fireEvent('mousedown')} },
	
	'toolbar'      :{element:'div', 'class':'miToolbar'},
	
	'|'            :{text:'|', title:'', element:'span'},
	'bold'         :{img:'0', shortcut:'b' },
	'italic'       :{img:'1', shortcut:'i' },
	'underline'    :{img:'2', shortcut:'u' },
	'strikethrough':{img:'3', shortcut:'s' },
	'subscript'    :{img:'4'},
	'superscript'  :{img:'5'},
	'indent'       :{img:'16'},
	'outdent'      :{img:'17'},
	'paste'        :{img:'9', title:'Paste (Ctrl+V)'},
	'copy'         :{img:'7', title:'Copy (Ctrl+C)'},
	'cut'          :{img:'8', title:'Cut (Ctrl+X)'},
	'redo'         :{img:'13', shortcut:'Y' },
	'undo'         :{img:'12', shortcut:'Z' },
	'justifyleft'  :{img:'20', title:'Justify Left'  },
	'justifycenter':{img:'18', title:'Justify Center'},
	'JustifyRight' :{img:'21', title:'Justify Right' },
	'justifyfull'  :{img:'19', title:'Justify Full'  },
	'insertorderedlist'  :{img:'22', title:'Numbered List'},
	'insertunorderedlist':{img:'23', title:'Bulleted List'},
	'test'         :{click:function(){console.log(arguments)}, args:this},
	'unlink'       :{img:'6'},
	'l0'           :{'text':'enter the url', element:'span' },
	'l1'           :{'type':'text',  events:{ 'mousedown':function(){ MooInline.Buttons.classReference.getRange(); }}, 'id':'miLink', unselectable: 'off' }, 
	'l2'           :{'type':'submit', 'click':function(args,classRef){ classRef.setRange() }, 'value':'add link' },
	'nolink'       :{'text':'please select the text to be made into a link'},
	'remoteURL'    :{click:['imgSelect','imgInput','insertimage']},
	'imgSelect'    :{element:'span', text:'URL of image' },
	'imgInput'     :{type:'text' },
	'insertimage'  :{click:function(args, classRef){ 
						classRef.exec([this.getParent().getElement('input[type=text]').get('text')]) 
					}},
	'inserthorizontalrule':{img:'22'},	
	'save'         :{ img:'11', click:function(){
						var content = MooInline.Buttons.self.clean();
						(savePath || (savePath = new Request({'url':'http://www.google.com'}))).send($H({ 'page': window.location.pathname, 'content': content }).toQueryString() );	
					}},
	'Html/Text'    :{ img:'26', click:['DisplayHTML']}, 
	'DisplayHTML'  :{ element:'textarea', 'class':'displayHtml', unselectable:'off', init:function(){ 
						var el=this.getParent('.miMooInline').retrieve('field'), p = el.getParent(); 
						var size = (p.hasClass('miTextArea') ? p : el).getSize(); 
						this.set({'styles':{width:size.x, height:size.y}, 'text':el.innerHTML.trim()})
					}},
	'colorpicker'  :{ 'element':'img', 'src':'images/colorPicker.jpg', 'class':'colorPicker', click:function(){
						//c[i] = ((hue - brightness) * saturation + brightness) * 255;  hue=angle of ColorWheel.  saturation =percent of radius, brightness = scrollWheel.
						var c, radius = this.getSize().x/2, x = mouse.x - radius, y = mouse.y - radius, brightness = hue.y / hue.getSize().y, hue = Math.atan2(x,y)/Math.PI * 3 - 2, saturation = Math.sqrt(x*x+y*y) / radius;
						for(i=0;i<3;i++) c[i] = ((((h=Math.abs(++hue)) < 1 ? 1 : h > 2 ? 0 : -(h-2)) - brightness) * saturation + brightness) * 255;  
						c[1] = -(c[2] - 255*saturation);
						var hex = c.rgbToHex();
					}},
	'fuUploadBar1' :{ click:['fuBrowse', 'fuUpload', 'fuClear','fuStatus','fuList'], title:'Upload Image' },
	'fuUploadBar'  :{ title:'Upload Image', img:25, click:function(args, classRef){
						classRef.toolbar(this.getParent('.miRTE'),'0_','fuUploadBar',['fuBrowse', 'fuUpload', 'fuClear','fuStatus','fuList'])
					}},
	'fuBrowse'     :{ id:"fuBrowse", click:function(){}, element:'span', text:'Browse Files', title:''},
	'fuUpload'     :{ id:"fuUpload", click:'', element:'span', text:'Upload Files', title:''},
	'fuClear'      :{ id:"fuClear", click:function(){console.log('clear here')}, element:'span', text:'Clear List' ,title:''},	
	'fuStatus'     :{ element:'span', id:'fuStatus', init:function(){
						this.adopt(
							new Element('strong', {'class':'overall-title'}),
							new Element('strong', {'class':'current-title'}),
							new Element('div', {'class':'current-text'}),
							new Element('img', {'class':'progress overall-progress', src:'mooinline/plugins/fancyUpload/assets/progress-bar/bar.gif' }),
							new Element('img', {'class':'progress current-progress', src:'mooinline/plugins/fancyUpload/assets/progress-bar/bar.gif' })
						)
					}},
	'fuList'       :{ id:'fuList', style:'display:none', init:function(){
						Asset.javascript('mooinline/plugins/fancyUpload/fancyUpload.js');
						Asset.css('mooinline/plugins/fancyUpload/fancyUpload.css');
					}},
	'fuPhotoUpload':{ id:'demo-photoupload', element:'input', type:'file', name:'photoupload' },
	'loading..'    :{ 'class':'miLoading', 	element:'span', text:'loading...',title:''}
})


/* Ideapad:
a) add variable to signify whether or not buttons should be run, 
b) add postInit that is run after buttons are init'd.
c) addCollection takes as the second parameter the object after which to put the toolbar.  It must exist, so we will now manually create it for init, and must modify buttons to send along parent
d) create a subfunction that calls toolbar and use it instead in the mousedown function.
e) should there be an init before any buttons are pressed, and a expanded() when all are, or a different set of rules for init on menus?
f) extend elements with .mooInline() if option is set.
g) some way for new groups to be made on the same row as the old groups are (like toolbars in word)
h) onIint:expand() and expandHidden should expand.
i) add an onExpand, onExpandHidden and onCollapse, and a onCollapse function
j) defualt styles for a etc should be added to api docs
k) press btn which will press key / expand menu, and run optional function afterwards.
l) add object of functions it should check on each update key {widetBtn:function(){widteVar?true:false;}}
m) Add support for args to be a function. Run function for value of args.
n) Allow defaults to have spaces when passed in.
o) editing functions should not work out of the scope of the toolbar's fields (I shouldn't be able to click on a button on the "wrong" toolbar, and certainly not a field is not meant to be editable.)
p) the defaults when passed in should have all the new flexibilty scheduled for the hash.
q) if a input/textarea, unselectable should be off.
r) pressing buttons should only work for text within a associated field.
s) Add a tab button.
t) Add an onHide() handler

Design Decisions:
a) Logic of button check:
	at press, all other buttons within it's collection are reset.
	if execBtn - will be redepressed as needed.
	ignoreState == false, btn will show itself as pressed until reset (either by user function or by other button in collection being pressed). 
	ignoreState == true, button will not "press".  if a string, variable will be added to that which updateBtns checks on each press  [perhaps using the collection?].
b) What parameters should addCollection require?
	a) Currently handles following: a) buttons to add to collection.  b & c) placing d) name e) visibilty f) caller.
	Ideally should not require so much: 
		Buttons(cannot just pass location, as this is more flexible, and any button can have button list in more than one place)
		Containing div (key of object).  Optional, as it will use a plain div (with the styles of a tollbar from openwysiwyg) if none is passed.
		Group which the containing div is a part of.  -  explain - should groups be maintained separately?
		
c) More work on groups / collections. 	
d) should defaults be dynamically added to the buttons hash if different?
e) some way of applying classes, events. etc to collections (add to hash?)
f) Expand the 'collection' array object. 
	a) It already can be called onLoad and onClick.  Add to args?
	b) Allow it to be an object, where the key refers to the containing element.  {main:['bold', 'italics']} becomes <div class="miCollection_Main"><a class="miBold">..
	c) Allow it to have within it nested arrays: [['main','bold'],['italics']] where each will expand.
		If done correctly, this should make it infinitely more flexible (and confusing?)
g) Alternatively, should there be a contains tag which allows subgroups to be expanded to be run?
h) Should there be a postFunc that runs after function is run?
	a) to create the subdialogs, using postfunc.
j) Add invisible parameter to make invisible? or rely on adding the miHide class
k) Can onLoad be told to run 'click'?
		
Bugs:
a) Throws an error sometimes when inline
b) when inline - clicking the bar should not make it dissapear!!
*/
			
/*
ChangeLog:
40: 

*/

/* Old Code:

*/