
/*
---
description: Rich Text Editor (WYSIWYG / NAWTE / Editor Framework) that can be applied directly to any collection of DOM elements.

copyright:
- November 2008, 2010 Sam Goody

license: OSL v3.0 (http://www.opensource.org/licenses/osl-3.0.php)

authors:
- Sam Goody <siteroller - |at| - gmail>

requires:
- core

provides: [MooRTE, MooRTE.Elements, MooRTE.Utilities, MooRTE.Range, MooRTE.Path, MooRTE.ranges, MooRTE.activeField, MooRTE.activeBar ]

credits:
- Based on the tutorial at - http://dev.opera.com/articles/view/rich-html-editing-in-the-browser-part-1.  Bravo, Olav!!
- Ideas and inspiration - Guillerr, CheeAun, HugoBuriel
- Some icons from OpenWysiwyg - http://www.openwebware.com
- Cleanup regexs from CheeAun and Ryan's work on MooEditable (methodology is our own!)
- MooRTE needs YOU!!

Join our group at: http://groups.google.com/group/moorte

...
*/

var loopStop = 0; // Testing only
Browser.webkit = Browser.safari || Browser.chrome;
Object.extend('set', function(key, val){
	var obj = {};
	obj[key] = val;
	return obj;
});

var MooRTE = new Class(

	{ Implements: [Options]

	, options: 
		{ floating: true // false broken by WK bug - "an editable element may not contain non-editable content".
		, padFloat: true // if (padFloat && where == before||after) existing margins are enlarged. top/bottom: padding always added. If false shrinks element accordingly.
		//, where: 'before' //  'top' is the same as 'before', except that it shrinks the element accordingly.
		, stretch: false // If element grows, should it stretch the element or add toolbars. Other options abound.
		// TODO: floating, padFloat, and stretch should be combined.
		, location: 'elements' // [element:Mixed [, where:String]]
			// element: CSS selector, Element/ElementCollection, or keyword: 'hidden', 'inline', 'page' or 'elements'.
			// If one element, will create one toolbar. If multiple, each rte will have it's own toolbar. If the numbers do not match, will return an error.
			// where: 'top/bottom/before/after' (Mootools standard). Defaults to 'top' for everything but 'elements', that defaults to 'before'.
		, buttons: 'div.Menu:[Main,File,Insert]'
		, skin: 'Word03'
		, elements: 'textarea, .rte'
		}

	, initialize: function(options){

		this.setOptions(options);

		var rte
		  , self = this
		  , els = $$(this.options.elements);
		
		if (!MooRTE.activeField) MooRTE.extend(
			{ ranges: {}
			, btnVals: []
			, activeBar: ''
			, activeField: ''
			});
		if (!Browser.ie) MooRTE.btnVals.push('unselectable');
		
		var loc = this.options.location;
		if (Type.isArray(loc) && !Type.isElement(loc[1])) loc = loc[0];
		loc = 'page,hidden,inline,elements'.contains(loc,',') ? {where: loc} : {els: $$(loc)};
		loc.where = this.options.location[1] == 'elements' ? 'before' : 'top';
		if (loc.els && loc.els.length) loc.els.length == 1 ? loc.els = loc.els[0] :
			(loc.els.length == els.length ? loc.where = 'userEls' 
				: console.log('Mismatch between number of editable elements and toolbars'));

		els.each(function(el,index){
			if ('textarea,input'.contains(el.get('tag'), ',')) els[index] = el = self.textArea(el);
	
			if ('elements,userEls'.contains(loc.where) || !rte) rte = self.insertToolbar(loc, index);
			if (loc.where == 'elements') self.positionToolbar(el, rte);
			else if (loc.where == 'inline') MooRTE.Utilities.addEvents (
				{ focus: function(){ self.positionToolbar(el, rte); }
				, blur: function(){
					var pad = this.getStyle('padding-top').slice(0,-2) - rte.getFirst().getSize().y;
					this.removeClass('rteShow').setStyle('padding-top', pad);
					rte.addClass('rteHide');
					}
				});

			el.set('contentEditable', true).store('bar', rte);
			
			MooRTE.Utilities.addEvents(el, 
				{ keydown: MooRTE.Utilities.shortcuts
				, keyup  : MooRTE.Utilities.updateBtns
				, mouseup: MooRTE.Utilities.updateBtns
				, focus  : function(){ MooRTE.activeField = this; MooRTE.activeBar = rte; }
				});
			MooRTE.Utilities.addEvents(rte, {'mouseup': MooRTE.Utilities.updateBtns});
			
			//if (Browser.firefox) el.innerHTML += "<p id='rteMozFix' style='display:none'><br></p>";
			});
		
		rte.store('fields', els);
		
		MooRTE.activeField = els[0];
		MooRTE.activeBar = MooRTE.activeField.retrieve('bar');

		if (Browser.firefox) MooRTE.Utilities.exec('styleWithCSS');
		// MooRTE.Utilities.exec('useCSS', 'true'); - FF2, perhaps other browsers?
		//if (loc=='pagetop') rte.addClass('rtePageTop').getFirst().addClass('rteTopDown'); else if (loc=='pagebottom') rte.addClass('rtePageBottom');
		}
	, insertToolbar: function (pos, index){
		var self = this;
		var klass = 'rteRemove MooRTE ' + (pos.where == 'hidden' || pos.where =='inline' ? 'rteHide' : '');
		var rte = new Element('div', {'class': klass, contentEditable: false })
			.adopt (new Element('div', {'class': 'RTE ' + self.options.skin }))
			.inject ((pos.where == 'elements' ? pos.els[index] : pos.els) || document.body, pos.where);
		MooRTE.activeBar = rte;
		MooRTE.Utilities.addElements(this.options.buttons, [rte.getFirst(), 'bottom']);  //,{className:'rteGroup_Auto'}); ////3rdel. Should give more appropriate name. Also, allow for last of multiple classes  
		return rte;
		}

	, positionToolbar: function (el, rte){
		el.set('contentEditable', true).addClass('rteShow');
		var o = this.options
		  , elSize = el.getCoordinates()
		  , bw = el
				.addClass('rte'+(o.stretch?'':'No')+'Stretch')
				.getStyle('border-width')
				.match(/(\d)/g)
		  , rteHeight = rte
				.removeClass('rteHide')
				.setStyle('width', elSize.width-(o.floating?0:bw[1]*1+bw[3]*1))
				.getFirst()
				.getCoordinates()
				.height;

		if (o.floating){
			var pad = {before:'margin-top',after:'margin-after',top:'padding-top',bottom:'padding-bottom'}[o.where];
			el.setStyle(pad, parseInt(el.getStyle(pad)) + rteHeight);
			if (!o.padFloat) el.setStyle('min-height', elSize.height - rteHeight).setStyle('height', elSize.height - rteHeight);

			//in o.floating adds a margin above the textarea. Had been 'top': elSize.top - rteHeight > 0 ? elSize.top : elSize.bottom
			rte
				.setStyles({ 'left': elSize.left, 'top': elSize.top })
				.addClass('rteFloat')
				.getFirst()
				.addClass('rteFloat');
			}		
		//else rte.inject(el,'top').setStyle('margin','-'+el.getStyle('padding-top')+' -'+el.getStyle('padding-left'));
		else el.setStyle('padding-top', el.getStyle('padding-top').slice(0,-2)*1 + rteHeight).grab(rte,'top');
		}

	, textArea: function (el){
		var div = new Element('div', 
			{ text: el.get('value')
			, 'class': 'rteTextArea '+el.get('class')
			, 'styles': {width:el.getSize().x}
			}
		).setStyle(Browser.ie?'height':'min-height',el.getSize().y)
		 .store('src', el).replaces(el);
		el.store('new', div);

		var form = el.getParent('form');
		if (form) MooRTE.Utilities.addEvents(form, {'submit': function(){
			el.set('value', MooRTE.Utilities.clean(div)).replaces(div); 
			} });
		return div;
		}
	});

MooRTE.Elements =
	{ strikethrough	:{}
	, justifyLeft	:{}
	, justifyFull	:{}
	, justifyCenter	:{}
	, justifyRight	:{}
	, subscript		:{}
	, superscript	:{}
	, outdent		:{}
	, indent		:{}
	, insertHorizontalRule:{}
	, bold		 	:{ key:'b', source:'<b>' }
	, italic		:{ key:'i', source:'<i>' }
	, underline		:{ key:'u', source:'<u>' }
	, insertOrderedList:  { title:'Numbered List' }
	, insertUnorderedList:{ title:'Bulleted List' }
	, selectall   	:{ title:'Select All (Ctrl + A)' }
	, removeFormat	:{ title:'Clear Formatting' }
	, undo        	:{ title:'Undo (Ctrl + Z)' }
	, redo			:{ title:'Redo (Ctrl + Y)' }
	};

MooRTE.Tabs = {active:{}};   
MooRTE.Reserved = ['tag', 'key', 'contains', 'source', 'class', {events:'click'}, {events:'load'}];
MooRTE.Groups   =	{ RibbonOpts:{ place:'Ribbons'} }
MooRTE.Range = {
	create: function(range){
		var sel = window.document.selection || window.getSelection();
		if (!sel || sel.getRangeAt && !sel.rangeCount) return null; //console.log(1);
		return MooRTE.ranges[range || 'a1'] = sel.getRangeAt ? sel.getRangeAt(0) : sel.createRange();
		}
	, get: function(type, range){
		if (!range) range = MooRTE.Range.create();

		switch (type){
			case 'text': return range.text || range.toString();
			case 'node': return range.cloneContents
				? range.cloneContents()
				: new Element('div', {html:range.htmlText});
			default: case 'html':
				var content = range.htmlText;
				if (!content){
					var html = range.cloneContents();
					MooRTE.Range.content.empty().appendChild(html);
					content = MooRTE.Range.content.innerHTML;
				};
				return content;
		}
	}
	, set: function(range){
		range = MooRTE.ranges[range || 'a1'];
		if (range.select) range.select();
		else {
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}
		return MooRTE.Range;
	}
	, insert: function(what, range){ //html option that says if text or html?
		if (Browser.ie){
			if(!range) range = MooRTE.Range.create();
			range.pasteHTML(what);
		} else MooRTE.Utilities.exec('insertHTML',what);
		return MooRTE.Range;
	}
	, wrap: function(element, options, range){
		if (!range) range = MooRTE.Range.create();
		var El = new Element(element, options);
		try {
			Browser.ie 
				? range.pasteHTML(El.set('html', range.htmlText).outerHTML) 
				: range.surroundContents(El);
		} catch(e) {
			if (e.code == 1) return false; // "Bad Boundary Points"
		}
		return El;
	}
	, wrapText: function(element, caller){
		var area = caller.getParent('.RTE').getElement('textarea');
		if (!(element.substr(0,1)=='<')) element = '<span style="'+element+'">';
		if (!Browser.ie){
			var start = area.selectionStart
			  , reg = new RegExp('(.{'+start+'})(.{'+(area.selectionEnd-start)+'})(.*)', 'm').exec(area.get('value'))
			  , el = element + reg[2] + '</' + element.match(/^<(\w+)/)[1] + '>';
			area.set('value', reg[1] + el + reg[3]).selectionEnd = start + el.length;
		} else {
			var el = new Element(element||'span', {html:range.get()});
			range.pasteHTML(el);
		}
		return MooRTE.Range;
	}
	, replace: function(node, range){
		if (!range) range = MooRTE.Range.create();
		if (Browser.ie){
			var id = document.uniqueID;
			range.pasteHTML("<span id='" + id + "'></span>");
			node.replaces(document.id(id));
		} else {
			MooRTE.Utilities.exec('inserthtml', node); return;  //ToDo: is this really supposed to return?!
			range.deleteContents();  // Consider using Range.insert() instead of the following (Olav's method).
			if (range.startContainer.nodeType==3) {
				var refNode = range.startContainer.splitText(range.startOffset);
				refNode.parentNode.insertBefore(node, refNode);
			} else {
				var refNode = range.startContainer.childNodes[range.startOffset];
				range.startContainer.insertBefore(node, refNode);
			}	
		}
	}
	, parent: function(range){
		if (!(range = range || MooRTE.Range.create())) return false;
		return Browser.ie ? 
			typeOf(range) == 'object' ? range.parentElement() : range
			: range.commonAncestorContainer;
	}
};

(function(){
	if (Browser.firefox) MooRTE.Range.selection = window.getSelection();
	if (!Browser.ie) MooRTE.Range.content = new Element('div');
	}());
MooRTE.Utilities = 
	{ exec: function(){
		var args = Array.from(arguments).flatten();
		document.execCommand(args[0], args[2]||null, args[1]||false);
		}
	, shortcuts: function(e){
		if (e.key=='enter'){
			if (!Browser.ie) return;
			e.stop();
			return MooRTE.Range.insert('<br/>');
		}
		var be, btn, shorts = MooRTE.activeBar.retrieve('shortcuts');	

		if (e && e.control && shorts[e.key]){
			e.stop();
			btn = MooRTE.activeBar.getElement('.rte'+shorts[e.key]);
			btn.fireEvent('mousedown', btn);
		};
	}
	, updateBtns: function(e){
		var val
		  , update = MooRTE.activeBar.retrieve('update');

		update.state.each(function(vals){
			if (vals[2])
				vals[2].call(vals[1], vals[0]);
			else {
				try { val = window.document.queryCommandState(vals[0]) }
				catch(e){ val = false }
				vals[1][(val ? 'add' : 'remove') + 'Class']('rteSelected');
				// Try/Catch works around issue #2.
				// Note1.
			}
		});
		update.value.each(function(vals){
			val = window.document.queryCommandValue(vals[0]);
			if (val) vals[2].call(vals[1], vals[0], val);
		});
		update.custom.each(function(vals){
			vals[2].call(vals[1], vals[0], e);
		});
		if (Browser.firefox && MooRTE.Range.selection.anchorNode.id == 'rteMozFix'){
			MooRTE.Range.selection.extend(MooRTE.Range.selection.anchorNode.parentNode, 0);
			//MooRTE.Range.selection.collapseToStart();
		}
	}
	, addEvents: function(el, events){
		Object.append(el.retrieve('rteEvents',{}), events);
		el.addEvents(events);
	}
	, removeEvents: function(el, destroy){
		Object.each(el.retrieve('rteEvents',{}), function(fn, event){
			el.removeEvent(event, fn);
		});
		if (destroy) el.eliminate('rteEvents');
	}
	, eventHandler: function(onEvent, caller, name){

		// Must check if orig func or string is modified now that $unlink is gone. Should be OK.
		var event = Type.isFunction(onEvent) ? onEvent : ((MooRTE.Elements[name]['events']||{})[onEvent])
		  , provided = {element:name, event:onEvent};

		switch(typeOf(event)){
			case 'function':
				event.call(caller, name, onEvent); break;
			case 'array': 
				// Multiple events. Untested & likely to be deprecated.
				event = Array.clone(event).each(function(e){
					MooRTE.eventHandler(e, caller, name);
				}); break;
			case 'object':
				Object.every(Object.clone(event), function(val,key){
					var vals = Array.from(val).append([name,onEvent]);
					MooRTE.Utilities[key].apply(caller, vals);
				}); break;
			case 'string':
				onEvent == 'source' && onEvent.substr(0,2) != 'on'
					? MooRTE.Range.wrapText(event, caller)
					: MooRTE.Utilities.eventHandler(event, caller, name);
		}
	}
	, addElements: function(elements, place, options){
		//if (!MooRTE.btnVals.args) MooRTE.btnVals.combine(['args','shortcut','element','click','img','load','source','contains']);
		if (!place) place = MooRTE.activeBar.getFirst();
		else if (Type.isArray(place)){
			var relative = place[1]; 
			place = place[0];
		}
		if (!options) options = {};

		if (Type.isString(elements)){
			elements = elements.replace(/'([^']*)'|"([^"]*)"|([^{}:,\][\s]+)/gm, "'$1$2$3'");
			elements = elements.replace(/((?:[,[:]|^)\s*)('[^']+'\s*:\s*'[^']+'\s*(?=[\],}]))/gm, "$1{$2}");
			elements = elements.replace(/((?:[,[:]|^)\s*)('[^']+'\s*:\s*{[^{}]+})/gm, "$1{$2}");
			while (elements != (elements = elements.replace(/((?:[,[]|^)\s*)('[^']+'\s*:\s*\[(?:(?=([^\],\[]+))\3|\]}|[,[](?!\s*'[^']+'\s*:\s*\[([^\]]|\]})+\]))*\](?!}))/gm, "$1{$2}")));
			elements = JSON.decode('['+elements+']');
		}

		var els = []
		  , elsLoop = 0;
		do {
			if (els.length) elements = els, els = [];
			Array.from(elements).each(function(item){
				switch(typeOf(item)){
					case 'string': case 'element':
						els.push(item); break;
					case 'object':
						Object.each(item, function(val,key){
							els.push(Object.set(key,val))
						}); break;
					case 'array':
						item.each(function(val){els.push(val)});
						elsLoop = item.length;
				}
			});
		} while (elsLoop);
		
		var collection = []
		, bar = place.hasClass('MooRTE') ? place : place.getParent('.MooRTE');
		
		els.each(function(button){
			if (Type.isObject(button)){
				var btnVals = Object.values(button)[0];
				button = Object.keys(button)[0];
				}
			//console.log('addElements called. elements:',elements,', btn is:',button,', e is:',e,', func args are:',arguments);

			if (Type.isElement(button)) var newEl = button;
			else {
				var btn = button.match(/^([^.#!<>[]+)/i)[0];
				if (!MooRTE.Elements[btn]) var newEl = new Element(button);
				else var loc = {before:'Previous', after:'Next', top:'First'}[relative] || 'Last'
				    , e = place['get' + loc]('.rte' + btn);
				}
			
			if (newEl) var e = newEl.inject(place, relative);
			else if (!e || !options.ifExists){
				var val = MooRTE.Elements[btn]
				  , textarea = (val.tag && val.tag.toLowerCase() == 'textarea')
				  , input = 'text,password,checkbox,file,radio'.contains(val.type)
				  , state = /bold|italic|underline|strikethrough|unlink|(sub|super)script|insert(un)?orderedlist|justify(left|full|right|center)/i.test(btn);

				var properties = Object.append(
					{ title: btn
						.replace(/([0-9]+|[A-Z][a-z]+|[A-Z]+(?=[A-Z][a-z]|[0-9])|^[a-z]+)/g, "$1 ")
						.trim().capitalize() + (val.key ? ' (Ctrl+'+ val.key.toUpperCase()+')' : '')
					, events:{}
					}, Object.clone(val));

				if (!val.tag || val.tag == 'A') val.tag = input ? 'input' : 'a';
				if (val.tag == 'a') properties.href = 'javascript:void(0)';
				if (Browser.ie || Browser.opera) unselectable = input || textarea ? 'off' : 'on';
				if (val.class) button += '.'+val.class;				

				properties.events.mousedown = function(e){
					MooRTE.activeBar = bar;
					var source = bar.retrieve('source')
					  , fields = bar.retrieve('fields');
					
					// Workaround, see docs.
					var holder = MooRTE.Range.parent();
					if (Browser.webkit && holder.nodeType == 3) holder = holder.parentElement;
					
					if (!(fields.contains(MooRTE.activeField) && MooRTE.activeField.contains(holder)))
						(MooRTE.activeField = fields[0]).focus();

					if (e && e.stop) input || textarea ? e.stopPropagation() : e.stop();
					!(val.events||{}).click && !input //&& !source && (!val.tag || val.tag == 'a')
						? MooRTE.Utilities.exec(val.args || btn)
						: MooRTE.Utilities.eventHandler(source || 'click', this, btn);
					}

				MooRTE.Reserved.each(function(bye){
					Type.isString(bye)
						? delete properties[bye]
						: Object.each(bye, function(del,where){
							if (properties[where]) delete properties[where][del]
							});
					});
				
				e = new Element(val.tag + '.rte'+button, properties).store('key',btn).inject(place, relative);

				if ((val.events||{}).update || state)
					bar.retrieve('update', {'value':[], 'state':[], 'custom':[]})[
						/font(name|size)|(back|fore|hilite)color/i
							.test(btn) ? 'value' : (state ? 'state' : 'custom')
					].push([btn, e, (val.events||{}).update]);
				
				if (val.shortcut) bar.retrieve('shortcuts',{})[val.shortcut] = btn;//.set(val.shortcut,btn);
				//if (collection.getCoordinates().top < 0)toolbar.addClass('rteTopDown'); //untested!!
			}

			var sub = btnVals || val && val.contains;
			if (sub && !(options.ifExists == 'stop' && !val))
				MooRTE.Utilities.addElements(sub, e, options.inherit ? options : {});
			e.removeClass('rteHide');
			collection.push(e);

			if (!newEl) MooRTE.Utilities.eventHandler('load', e, btn);
		});
		
		return collection[1] ? collection : collection[0];	
	}
	, tabs: function(tabGroup){ //[, elements][, options], name, event 

		//MooRTE.btnVals.combine(['onExpand','onHide','onShow','onUpdate']);

		var args = Array.from(arguments)
		  , name = args.splice(-2).shift()
		  , options = args[2] || {}
		  , entry = MooRTE.Tabs[tabGroup];

		if (!entry) MooRTE.Tabs[tabGroup] = {};
		else Object.each(entry, function(els, title){
			//[Hide when same, as in when called from custom, to prevent it hiding itself.].
			if (els[0]) if (els[0] == this) return; else els[0].removeClass('rteSelected');
			if (els[1]) els[1].addClass('rteHide');
			if ((options.events||{}).hide) options.events.hide.call(this, name);
			}, this);

		MooRTE.Tabs.active[tabGroup] = name;
		this.addClass('rteSelected').addClass('rteGroupBtn_'+name);
		if (entry = MooRTE.Tabs[tabGroup][name]){
			if (!entry[0]) entry[0] = this;
			return entry[1].removeClass('rteHide');
			}

		if (!args[1]) return; // No group;
		if (Type.isString(options.place)) 
			options.place = this.getParent('.MooRTE').getElement('.rte'+options.place);

		var group = MooRTE.Utilities.addElements(args[1], options.place, {className:'rteGroup_'+name});
		MooRTE.Tabs[tabGroup][name] = [this, group];
		if ((options.events||{}).show) options.events.show.call(this, {content:group});
		}

	, addTab: function(tabGroup, tabName){
		if (!MooRTE.Tabs[tabGroup]) MooRTE.Tabs[tabGroup] = {};
		if (!MooRTE.Tabs[tabGroup][tabName]) MooRTE.Tabs[tabGroup][tabName] = [];
		MooRTE.Tabs[tabGroup][tabName][+(tabName != Array.from(arguments).splice(-2,1))] = this;
		}

	, flyout: function(content, btn, event){
		var opts = 
			{ place: 'Flyouts'
			, events: 
				{ show: function(flyout){
					var pos = this.getParent().getCoordinates(this.getParent('.MooRTE'));
					flyout.content.setStyle('min-width', pos.width - 4)
						.setPosition({x:pos.left - 1, y:pos.height + pos.top });
					}
				}
			};
		MooRTE.Utilities.tabs.call(this, 'flyouts', content, opts, btn, event);
		}
	, popup: function(content, btn, event){
		content= [ 'div.popup:[div.title,div.closeandhelp:[a.help,a.close],div.content:['
   				, ',div.submit:[span.input.insert,span.input.cancel]] ]'].join(content);
   		console.log(1);
		MooRTE.Utilities.tabs.call(this, 'popups', content, {place:'Flyouts'}, btn, event);
		}

	, clipStickyWin: function(caller){
		if (Browser.firefox || (Browser.webkit && caller=='paste')) 
			if (window.AssetLoader) AssetLoader.javascript(['mootools-more.js','StickyWinModalUI.js'], {
				onComplete: function(command){
					var body = "For your protection, "+(Browser.webkit?"Webkit":"Firefox")+" does not allow access to the clipboard.<br/>\
						<b>Please use Ctrl+C to copy, Ctrl+X to cut, and Ctrl+V to paste.</b><br/><br/>\
						If this functionality is important consider switching to Internet Explorer,<br/> which allows us to access [and modify] your system."; 
					MooRTE.Elements.clipPop = new StickyWin.Modal({content: StickyWin.ui('Security Restriction', body, {buttons:[{ text:'close'}]})});	
					MooRTE.Elements.clipPop.hide();
				}
			});
	}
	, fontsize: function(dir, size){
	
		if (size == undefined)
			size = window.document.queryCommandValue('fontsize') 
				|| MooRTE.Range.parent().getStyle('font-size');
		
		//if (size == +size) size = +size + dir;
		if (dir) size = +size + dir;
		else {
			// MooRTE.Utilities.convertunit(size[0],size[1],'px'); Convert em's, xx-small, etc.
			size = size.split(/([^\d]+)/)[0];
			[0,10,13,16,18,24,32,48].every(function(s,i){
				if (s < size) return true;
				size = !(s - size) || dir < 0 ? i + dir : i;
				});
			}

		MooRTE.Utilities.exec('fontsize', size);
		}
	, clean: function(html, options){
	
		options = Object.append({
			xhtml   : false, 
			semantic: true, 
			remove  : ''
		}, options);
		
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
			[/<p>(?:\s*)<p>/g, '<p>']												// Remove empty <p> tags
		];
		
		var washer;
		if (typeOf(html)=='element'){
			washer = html;
			var bar = washer.retrieve('bar');
			if (washer.contains(bar) && washer != bar) washer.moorte('remove');
			//if(washer.hasChild(washer.retrieve('bar'))) washer.moorte('remove');
		} else washer = $('washer') || new Element('div',{id:'washer'}).inject(document.body);

		washer.getElements('p:empty'+(options.remove ? ','+options.remove : '')).destroy();
		if (!Browser.firefox) washer.getElements('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) el.replaces(p)  });  // The following will not apply in Firefox, as it redraws the p's to surround the inner one with empty outer ones.  It should be tested for in other browsers. 
		html = washer.get('html');
		if (washer != $('washer')) washer.moorte();
		
		if (xhtml) cleanup.append(xhtml);
		if (semantic) cleanup.append(semantic);
		if (Browser.webkit) cleanup.append(appleCleanup);

		// var loopStop = 0;  //while testing.
		do {
			var cleaned = html;
			cleanup.each(function(reg){ html = html.replace(reg[0], reg[1]); });		
		} while (cleaned != html); // && ++loopStop <3
		
		return html.trim();
	}
};

if (false) Object.extend(MooRTE.Utilities, 
	{	update: function(group){
	 		Object.each(MooRTE.tabs[group], function(els){
	 			els[0].removeClass('rteSelected');
	 			});
	 		pos = styles.getStyle('background-position');
			head.setStyle('background-position', pos);
			}
	});

MooRTE.extensions = function(){
	
	var params = Array.link(arguments, {'options': Type.isObject, 'cmd': Type.isString, 'rte':Type.isElement})
	  , cmd = 'detach,hide,remove,destroy'.test(params.cmd,'i') ? params.cmd.toLowerCase() : ''
	  , editables = Array.from(this);
	
	editables.every(function(self, i){

		var bar
		  , els
		  , self = editables[i] = self.retrieve('new') || self;

		if (params.rte){
			bar = params.rte.hasClass('MooRTE') ? params.rte : params.rte.retrieve('bar');
			if (!bar) return alert('Err 600: The passed in element is not connected to an RTE.'), 600;
			if (self.retrieve('bar') != bar){
				self.retrieve('bar').retrieve('fields').erase(self);
				self.store('bar', bar);
				bar.retrieve('fields').include(self);
			}
		} else bar = self.hasClass('MooRTE') ? self : self.retrieve('bar');

		if (!cmd){
			if (!bar){ 
				new MooRTE(Object.merge(params.options || {}, {'elements':this}));
				editables[i] = self.retrieve('new') || self;
				return false;
			} else if (bar.hasClass('rteHide')) return bar.removeClass('rteHide');
		} else if (!bar || self.retrieve('removed') || !self.getParent()) return true;
		
		switch (cmd){
			case 'hide':
				return bar.addClass('rteHide');
			case 'detach':
				if (self == bar) return true;
				bar.retrieve('fields').erase(self); 
				els = [self];
				break;
			case 'remove':
				// Don't store 'removed' if already stored. Alternatively could check if element is in DOM by if (!bar.getParent()). 
				// ToDo: Added as a hotfix, but why is this check neccessary?
				if (bar.retrieve('removed')) return true;
				bar.store('removed', bar.getPrevious()
						? [bar.getPrevious(),'after']
						: [bar.getParent(),'top']);
				bar.dispose();
				els = bar.retrieve('fields');
				break;			
			case 'destroy':
				els = bar.retrieve('fields');
				bar = bar.destroy();
				break;
			default:
				els = [self]
				  , removed = bar.retrieve('removed');
				if (removed){
					els = bar.retrieve('fields');
					bar.inject(removed[0], removed[1]).eliminate('removed');
				} else if (self == bar) return;
				
				els.each(function(el){
					bar.retrieve('fields').include(el);
					var src = el.retrieve('src');
					if (!src){
						el.set('contentEditable', true);
						MooRTE.Utilities.addEvents(el, el.retrieve('rteEvents'));
						// if (Browser.firefox && !el.getElement('#rteMozFix')) 
						//	el.grab(new Element('div', {id:'rteMozFix', styles:{display:'none'}}));
					} else if (src.getParent()) el.set('html', src.get('value')).replaces(src);
				})
				return true;
		}
				
		editables[i] = self.retrieve('src') || self;
		els.each(function(el){
			if (Browser.firefox && el.getElement('#rteMozFix')) el.getElement('#rteMozFix').destroy();
			var src = el.retrieve('src');
			if (src){
				src.set('value', el.get('html')).replaces(el);
				if (!bar){
					src.eliminate('new');
					el.destroy();
				}
			} else {
				el.set('contentEditable', false);
				MooRTE.Utilities.removeEvents(el, 'destroy');
				if (!bar) el.eliminate('bar');
			}
		});
		return true;
	}.bind(this));
	
	return editables;
}

Element.implement({moorte:MooRTE.extensions});
Elements.implement({moorte:MooRTE.extensions});

MooRTE.Word10 = // Word 10 Elements
	{ stylesCollection:
		{ tag:'div'
		, contains:'[div.f_normal.rteSelected:div,div.f_noSpacing:div,div.f_h1:div,div.f_h2:div,div.f_h3:div]'
		}
	, arrow:		
		{ events:
			{ load: function(){
				var prev = this.getPrevious();
				var which = prev.get('tag') == 'input' ? 2 : +(prev.getSize().y > 25);
				//var which = +(prev.getSize().y < 25) + +(prev.get('tag') == 'input');
				new Element('span.arrowCase.arrow' + which).wraps(prev).grab(this);
				}
			, click: function(){
				var prev = this.getPrevious().retrieve('key');
				MooRTE.Utilities.flyout.call(this, prev+'Flyout', prev, 'click');
				}
			}
		}

	// Tabs
	, FileTab:
   	{ text:'File', events:
   		{click:{tabs: ['RibbonTabs', 'FileRibbon', MooRTE.Groups.RibbonOpts]} }
   	}
	, HomeTab:	
		{ text:'Home', 'class':'rteSelected', events:
			{ load: {addTab:['RibbonTabs']}
			, click:{tabs: ['RibbonTabs', 'HomeRibbon', MooRTE.Groups.RibbonOpts]}
   		}
   	}
   , InsertTab:
		{ text:'Insert', events:{
			click:{tabs: ['RibbonTabs', 'InsertRibbon', MooRTE.Groups.RibbonOpts]}} 
		}
	
	// Ribbons
	, TopBar: {tag:'div', contains:'save,undo,redo'} 
   , FileRibbon: 
		{ tag:'div', contains:
			'div.rteFileGroup:[div:[insertHorizontalRule]]' 
		}
	, HomeRibbon:
   	{ tag:'div'
   	, events:{ load:{addTab:['RibbonTabs', 'HomeTab']} }
   	, contains: 
			'div.rteClipGroup:[div:[paste32,arrow,span.stacked:[cut,copy,formatPainter]]]\
			,div.rteFontGroup:[div:[fontFamily,arrow,fontSize,arrow,increaseFontSize,decreaseFontSize\
				,span.rtedivider,changeCase,span.rtedivider,removeFormat,bold,italic,underline,arrow,strikethrough\
				,subscript,superscript,span.rtedivider,style,arrow,hilight,arrow,fontColor,arrow]]\
			,div.rteParaGroup:[div:[insertUnorderedList,arrow,insertOrderedList,arrow,multiLevelList\
				,span.rtedivider,indent,outdent,span.rtedivider,sort,span.rtedivider,invisibleChars,justifyLeft,justifyCenter\
				,justifyRight,justifyFull,span.rtedivider,paragraphSpacing,span.rtedivider,fill,arrow,borderBottom,arrow]]\
			,div.rteStylGroup:[div:[div.stylesCollection:[div.f_normal.rteSelected:div,div.f_noSpacing:div,div.f_h1:div,div.f_h2:div,div.f_h3:div],changeStyles,arrow]]\
			,div.rteEditGroup:[div.stacked:[find,replace,selection]]'
		}
	, InsertRibbon:
		{ tag:'div.bigIcons', contains:
			'div.rtePageGroup:[div:[coverPage,arrow,blankPage,pageBreak]]\
			,div.rteTablGroup:[div:table]\
			,div.rteIlluGroup:[div:[picture,clipArt,shapes,smartArt,chart,screenshot]]\
			,div.rteLinkGroup:[div:[hyperlink,bookmark,"cross-reference"]]\
			,div.rteHeadGroup:[div:[header,footer,pageNumber]]\
			,div.rteTextGroup:[div:[textBox,quickParts,wordArt,dropCap,span.stacked.smallIcons:[signatureLine,dateTime,object]]]\
			,div.rteSymbGroup:[div:[equation,arrow,symbol]]'
		}
	// Flyout Triggers
	, symbol:{ events:{ click:{flyout:['symbolFlyout']} }}
	, changeCase:
		{ 'class':'wideIcon'
		, events:
			{ click : {flyout:['div.caseFlyouts:[sentencecase,lowercase,uppercase,wordCase,togglecase]']}
			, update: function(el, event){
				var active, flyouts = MooRTE.Tabs.flyouts;
				if  (  !flyouts 
					|| !(active = flyouts[MooRTE.Tabs.active.flyouts])
					|| MooRTE.Tabs.active.flyouts == event.target.retrieve('key')
					 ) return;
				
				active[0].removeClass('rteSelected');
				active[1].addClass('rteHide');
				MooRTE.Tabs.active.flyouts = '';
				}
			}
		}

	// Flyouts
	, underlineFlyout:  { tag:'div' }
	, bulletsFlyout:    { contains: 'insertorderedlist,insertunorderedlist'}  
	, listFlyout:       { contains: 'insertorderedlist,insertunorderedlist'}
	, fontFamilyFlyout: { tag:'div', contains: 'div.f_calibri,div.f_tahoma,div.f_comic'}
	, fontSizeFlyout:
		{ tag: 'div'
		, events:
			{ load: function(){
				this.addEvent('click:relay(div)',function(){
					MooRTE.Utilities.fontsize(0, this.get('text'));
					});
				[8,9,10,11,12,14,16,18,20,22,24,26,28,36,48,72]
					.each(function(num){ this.grab(new Element('div',{text:num})); },this);
				}
			, update: function(el, event){
				var active, flyouts = MooRTE.Tabs.flyouts;
				if  (  !flyouts 
					|| !(active = flyouts[MooRTE.Tabs.active.flyouts])
					|| MooRTE.Tabs.active.flyouts == event.target.retrieve('key')
					 ) return;
				
				active[0].removeClass('rteSelected');
				active[1].addClass('rteHide');
				MooRTE.Tabs.active.flyouts = '';
				}
			}
		}
   , changeCaseFlyout: { contains: 'sentencecase,lowercase,uppercase,wordCase,togglecase'}
   , symbolFlyout:
   	{ tag: 'div', contains: function(){
			var chars = [174,169,165,163,8364,8805,8804,8800,177,8482,945,181,8734,215,247,9217,931,937,8719,946]
			  , div = new Element('div').addEvent('mousedown:relay(a)', function(){ 
			  			MooRTE.Range.insert(this.get('text')) 
			  			})
			  , p = new Element('p').addEvent('mousedown',function(){ 
						MooRTE.Utilities.popup.call(this,'symbolChart','symbolPopup','click') 
						});

			chars.forEach(function(char){ new Element('a',{href:'#',html:'&#'+char+';'}).inject(div); }); 
			return [div,p];
			}()
   	}

   , symbolChart:
		{ tag:'div',contains: [new Element('input#charCode',{type:'text'}),
			function(){
			//<a>'+n+'</a>
			for (var htm = '', n = 0; n < 10000; n++) htm += '<span>&#'+n+';</span>';
			return new Element('div',{html:htm}).addEvent('mousedown:relay(span)',function(){
				MooRTE.Range.insert(this.get('text'))
				});
			}()
			]
   	}
   , equations:
		[ 'ax^2 + bx + c = 0'
		, 'x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}'
		, '\\textstyle \\sqrt{x+2}\\quad \\underline 4\\quad \\overline{x+y}\\quad x^{\\underline n}\\quad x^{\\overline{m+n}} \\quad \\sqrt{x^2+\\sqrt{\alpha}}'
		, '\\cos x\\,+\\,\\cos y\\,=\\,2 \\cos \\frac{x\\,+\\,y}{2} \\cos \\frac{x\\,-\\,y}{2}'
		, '\\textstyle 10^{10}\\quad 2^{n+1}\\quad (n+1)^2\\quad \\sqrt{1-x^2}\\quad \\overline{w+\\bar z} \\quad p^{e_1}_1\\quad a_{b_{c_{d_e}}}\\quad \\root 3 \\of {h_n(\\alpha x)}'
		, '(1+x)^n=1+nx/1!+(n(n-1) x^2)/2!+?'
		, 'x^2 + y^2 = r^2'
		, 'A = \\pi r^2 \\sin x\\,\\pm\\,\\sin y\\,=\\,2 \\sin \\frac{x\\,\\pm\\,y}{2} \\cos \\frac{x\\,\\mp\\,y}{2}'
		, '(x+y)^n = \\sum_{r=0}^{n} {{n}\\choose{r}}y^r x^{n-r}'
		, '\\psi(x)=\\sum_i C_i \\phi_i(x)'
		]

   // Popups
   , paste32Popup:{contains:'div.pasteMsg'}
	}
Object.merge(MooRTE.Elements,MooRTE.Word10);