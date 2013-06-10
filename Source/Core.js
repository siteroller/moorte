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