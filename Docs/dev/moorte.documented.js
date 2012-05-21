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

	options:{floating: false,location: 'elements',buttons: 'Menu:[Main,File,Insert,save]',skin: 'Word03',elements: 'textarea, .rte'},
	
	/*
	options:{
		floating: false,
		location: 'elements',//[e,n,t,b,'']
		buttons: 'Menu:[Main,File,Insert,save]',
		skin: 'Word03',
		elements: 'textarea, .rte'
	},
	*/
	initialize: function(options){
		this.setOptions(options);
		var self = this, rte, els = $$(this.options.elements), l = this.options.location.substr(4,1).toLowerCase();
		if(!MooRTE.activeField) MooRTE.extend({ranges:{}, activeField:'', activeBtn:'', activeBar:'', path:new URI($$('script[src*=moorte.js]')[0].get('src')).get('directory') });
		
		els.each(function(el){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = self.textArea(el);
			if(l=='e' || !rte) rte = self.insertToolbar(l);							//[L]ocation == elem[e]nts. [Creates bar if none or, when 'elements', for each element]
			if(l=='b' || l=='t' || !l) el.set('contentEditable', true)//.focus();	//[L]ocation == page[t]op, page[b]ottom, none[] 
			else l=='e' ? self.positionToolbar(el,rte) : el.addEvents({				//[L]ocation == elem[e]nts ? inli[n]e
				'click': function(){ self.positionToolbar(el, rte); },
				'blur':function(){ 
					rte.addClass('rteHide'); this.removeClass('rteShow');//.set('contentEditable', false)
				}
			});
			el.store('bar', rte).addEvents({
				'mouseup':MooRTE.Utilities.updateBtns, 
				'keyup'  :MooRTE.Utilities.updateBtns, 
				'keydown':MooRTE.Utilities.shortcuts, 
				'focus'  :function(){ MooRTE.activeField = this; MooRTE.activeBar = rte; } //this.retrieve('bar');activeField is not used at all, activeBar is used for the button check.
			});
		})
		
		MooRTE.activeBar = (MooRTE.activeField = els[0]).retrieve('bar');					//in case a button is pressed before anything is selected. Was: els[0].fireEvent('focus');
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
		// no activeBar is set, moorte() when called from an element will crash. This safely gives a default.
		MooRTE.activeBar = rte;
		MooRTE.Utilities.addElements(this.options.buttons, rte.getFirst(), 'bottom', 'rteGroup_Auto'); //Should give more appropriate name. Also, allow for last of multiple classes  
		return rte;
	},
	
	positionToolbar: function (el, rte){													//function is sloppy.  Clean!
		el.set('contentEditable', true).addClass('rteShow');								//.focus();
		var elSize = el.getCoordinates(), f=this.options.floating, bw = el.getStyle('border-width').match(/(\d)/g);
		rte.removeClass('rteHide').setStyle('width', elSize.width-(f?0:bw[1]*1+bw[3]*1)).store('fields', rte.retrieve('fields', []).include(el));  //.setStyle('width',f?elSize.width:'100%') breaks if element's contents do not fill the width of the parent, or if parent has no explicit width [and requires content-box].
		if(f) rte.setStyles({ 'left':elSize.left, 'top':(elSize.top - rte.getFirst().getCoordinates().height > 0 ? elSize.top : elSize.bottom) }).addClass('rteFloat').getFirst().addClass('rteFloat');
		else rte.inject((el.getParent().hasClass('rteTextArea')?el.getParent():el),'top').setStyle('margin','-'+el.getStyle('padding-top')+' -'+el.getStyle('padding-left')); //'before' 
	},
	
	textArea: function (el){
		var div = new Element('div', {text:el.get('value'),'class':'rteTextArea '+el.get('class'), 'styles':el.getCoordinates()}).setStyle('overflow','auto').inject(el,'before');
		el.getParent('form').addEvent('submit',function(e){
			el.set('value', MooRTE.Utilities.clean(div)); 
		})
		el.addClass('rteHide');
		return div;
	}
});

MooRTE.Range = {
	// Create function takes selected area and stores inside a range object.
	create: function(range){
		var sel = window.getSelection ? window.getSelection() : window.document.selection;
		if (!sel) return null;
		return MooRTE.ranges[range || 'a1'] = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
		//MooRTE.activeBar.retrieve('ranges').set([rangeName || 1] = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
	},
	
	//Set function sets the 'active' range to whatever is passed in (instead of the current selection).
	set:function(rangeName){
		var range = MooRTE.ranges[rangeName || 'a1'];
		if(range.select) range.select(); 	//IE. Could use Mootools check as well, but this is more forward compliant - who knows IE9?
		else { 								//Other browsers
			var sel = window.getSelection;	//https://developer.mozilla.org/en/DOM/window.getSelection
			sel.removeAllRanges(); 			//https://developer.mozilla.org/En/DOM/Selection/RemoveAllRanges
			sel.addRange(range);			//https://developer.mozilla.org/En/DOM/Selection/AddRange
		}
		return MooRTE.Range;
	},
	
	// content element is used to store content for the MooRTE.Range.get function
	, content: new Element('div')
	/* function get - returns the contents of a Range.
		Arguments:
		type [String, optional. Defaults to 'html']
			'text' - Returns the text of the selection without any markup.
			'html' - Returns the html of the Range as a string. Invalid Markup is fixed in W3C browsers.
			'node' - Returns an element (IE) or a DocumentFragment (W3C Browsers) containing the Range's content.
		range [Range Object, optional. Defaults to the current range, stored in MooRTE.ranges.a1]
		
		This method is described at length, with variations, on the Siteroller Blog.
	*/
	, get: function(type, range){
	
		if (!range) range = MooRTE.Range.create();
		
		switch (type){
			case 'text': return range.text || range.toString();
			case 'node':
				if (range.cloneContents) return range.cloneContents();
				return MooRTE.Range.content.set('html', range.htmlText);
			default: case 'html': var content = range.htmlText;
				if (!content){
					var html = range.cloneContents();
					MooRTE.Range.content.empty().appendChild(html);
					content = MooRTE.Range.content.innerHTML;
				}; 
				return content;
		}
	
	wrap:function(element, options, range){
		if(!range) range = MooRTE.Range.create();
		var El = new Element(element, options);
		Browser.Engine.trident ?
			range.pasteHTML(El.set('html', range.htmlText).outerHTML) : 
			range.surroundContents(El);
		return El;
	},
	
	replace:function(node, range){
		if(!range) range = MooRTE.Range.create();
		if (Browser.Engine.trident){
			var id = document.uniqueID;
			range.pasteHTML("<span id='" + id + "'></span>");
			node.replaces($(id));
		} else {
			MooRTE.Utilities.exec('inserthtml', node); return;
			range.deleteContents();  //compare the following method (Olav's) with using the insertHTML execommand.
			if (range.startContainer.nodeType==3) {
				var refNode = range.startContainer.splitText(range.startOffset);
				refNode.parentNode.insertBefore(node, refNode);
			} else {
				var refNode = range.startContainer.childNodes[range.startOffset];
				range.startContainer.insertBefore(node, refNode);
			}	
		}
	}
}

MooRTE.Utilities = {
	exec: function(args){
		args = $A(arguments).flatten(); 												// args can be an array (for the hash), or regular arguments(elsewhere).
		var g = (Browser.Engine.gecko && 'ju,in,ou'.contains(args[0].substr(0,2).toLowerCase())); //Fix for FF3 bug for justify, in&outdent
		if(g) document.designMode = 'on';//alert(args);
		document.execCommand(args[0], args[2]||null, args[1]||false);					//document.execCommand('justifyright', false, null);//document.execCommand('createlink', false, 'http://www.google.com');
		if(g) document.designMode = 'off';
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
	
  /* elements[mixed:string/object/array] - the elements to add.
	* place [mixed:element/array] - where to add the new elements. If array [element,location] the second arg is 'before','after', etc.
	* options [object] - default is {} 
	*		{ className: [''] - any extra classes to add to the element.
	*		, inherits: [false/true] - if options should be passed to sub elements.
	*		, ifExists: [false/true/'stop'] - when adding an element similar to an existing one, should it use the existing.	
	*			false - Ignore existing. Create new element. 
	*			true - Use existing element.
	*			'stop': Do not create new or use existing.
	*		}
	*/
	addElements: function(buttons, place, options){
		// Not sure why this is the best place for this check:
		if (!MooRTE.btnVals.args) MooRTE.btnVals.combine(['args','shortcut','element','onClick','img','onLoad','source']);
		if (!place) place = MooRTE.activeBar.getFirst();
		else if (Type.isArray(place)){
			// In all but IE6, this could be written as [place,relative] = place;
			var relative = place[1]; 
			place = place[0];
		}
		// If no options are passed in, create an empty object, which is the equivalent to setting defaults to false/''. 
		if (!options) options = {};
		var parent = place.hasClass('MooRTE') ? place : place.getParent('.MooRTE'); 
		
		// elements can be an object/array or a string. eg {'div.Flyout':['indent','outdent']} or "{'div.Flyout':['indent','outdent']}"
		// MooRTE allows an invalid JSON string with implied Object and Array braces. eg: "'div.Flyout':[indent,outdent]"
		// The following turns it into valid JSON and converts it into an object or array.
		if (typeOf(elements) == 'string'){
			// surround strings with single quotes & convert double to single quoutes. 
			elements = elements.replace(/'([^']*)'|"([^"]*)"|([^{}:,\][\s]+)/gm, "'$1$2$3'");
			// add curly braces to string:string - makes {string:string} 
			elements = elements.replace(/((?:[,[:]|^)\s*)('[^']+'\s*:\s*'[^']+'\s*(?=[\],}]))/gm, "$1{$2}");
			// add curly braces to string:object.  Eventually fix to allow recursion.
			elements = elements.replace(/((?:[,[:]|^)\s*)('[^']+'\s*:\s*{[^{}]+})/gm, "$1{$2}");
			// add curly braces to string:array.  Allows for recursive objects - {a:[{b:[c]}, [d], e]}.
			while (elements != (elements = elements.replace(/((?:[,[]|^)\s*)('[^']+'\s*:\s*\[(?:(?=([^\],\[]+))\3|\]}|[,[](?!\s*'[^']+'\s*:\s*\[([^\]]|\]})+\]))*\](?!}))/gm, "$1{$2}")));
			// convert JSON to JS object. 
			elements = JSON.decode('['+elements+']');
		}
			
		// The following was a loop till 2009-04-28 12:11:22, commit fc4da3. 
		// The loop was then removed, probably by mistake, till 2009-12-09 13:18:15.
		// As 'elements' may contained nested objects, we must convert it to an array.
		// We use a new array 'els' instead of 'map', as map would not be able to handle multiple pushes, using each.
		var els = []
		  , elsLoop = 0; 
		do {
			if (els.length) elements = els, els = [];
			Array.from(elements).each(function(item){
				switch(typeOf(item)){
					case 'string':
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
			// While testing, we add in the loopstop variable
			// if (++loopStop > 50) return alert('crashed in addElements array handling'); 
		} while (elsLoop);

		els.each(function(btn){
			if (Type.isObject(btn)){
				var btnVals = Object.values(btn)[0];
				btn = Object.keys(btn)[0];
			}
			
			// The class is made up of any classes that are appended to the name of the element, 
			// eg: div.Flyout.Group1 would get the MooRTE.Elements.div with the classes Flyout and Group1
			// Additionally, we allow classes to be passed in using the options.className option. (multiple classes are seperated with a space.)
			// The major difference, is that div.Flyout gets prepended with "rte", and className does not.
			// ToDo: the className option will probably dropped before the next RC.
			var btnClass = '.rte' + btn.replace('.','.rte') + (options.className ? '.'+options.className.replace(' ','.') : '')
			// Check if the element exists in the location it would be entered into.
			// eg. if (place == $('myEl')) it will only look for elements already in $('myEl').
			// This check is (by design) loose - it doesn't check that $('myEl') is the last item, even though the new element is scheduled to be placed as the last item.
			// we could do an exact check using place['get'+(..'First')].matches(btnClass)
			// but dont since I think it would interfere with those cases one actually does want to reuse an existing element. because when 
			  , e = place['get' + ({before:'Previous', after:'Next', top:'First'}[relative] || 'Last')](btnClass)
			//alternatively written:
			//, loc = {before:'Previous', after:'Next'}[relative] || 'First', e = place['get' + loc](btnClass);	
			//, e = place['get'+ (relative == 'before' ? 'Previous' : relative == 'after' ? 'Next' : 'First')](btnClass);
			, btn = btn.split('.')[0];
			// [btn,btnClass] = btn.split('.'); - Code sunk by IE6
			
		  /* What should happen when attempting to add an element and a similar element already exists?
			* For example, div:[indent] and div:[justify] begin with a reference to the element called div. 
			* Should indent and justify both be added to the same element, should it create a new copy of the div element, or should it assume that since div already exists, all of the children must also exist?
			
			* Prior to about #3721b8d2 we assumed the last option. If the element existed, it made sure the element was visible and then exited.
			* In order to handle the case where we needed a duplicate to be created (such as the div.menu) a 'name' argument was allowed that added the named class to the element.
			* Another check was added that if the named class was one that we needed to duplicate, it should duplicate.
			* Fortunately, another bug in the code prevented other problems from arising ;)
			*
			* Since the aforementioned commit it by default will create a new element even if a similar one already exists.
			* One can force moorte to use an existing element by setting the option - useExistingEls to true. 
			* Even if so, elements are only considered the same if they have the same classes (including any classes in options.className).
			* eg. div refers to MooRTE.Elements['div']. div.Flyout.AnotherClass refers to the same element with two added classes, and will not match div.Flyout.class2
			* Also, the existing el must be in the correct location (loosely): see a few lines up where the check is done.
			* After #dd363d, the original behavior was reinstated as the ifExists:'stop' option. 
			*/
			
			/* ToDo: Chrome + Mootools bug. Demo here: http://jsfiddle.net/JFyCQ/ 
			* When an a contains a div, which in turn contains an a, Slick cannot find the div with getFirst/Last.
			* Probably related to the way the browser (Chrome, here) builds the elements & assumes an <a> cannot contain an <a>.
			* Oddly, the source here shows no signs of build problems, unlike the jsfiddle page.
			* This would affect an attempt to place an element inside a flyout, which uses said structure.
			* Could be fixed by using some other elements, with fixes for other bugs.
			*/
			var e = parent.getElement('.rte'+btn);
			if (!e){
				var bgPos = 0, val = MooRTE.Elements[btn], input = 'text,password,submit,button,checkbox,file,hidden,image,radio,reset'.contains(val.type), textarea = (val.element && val.element.toLowerCase() == 'textarea');
				var state = 'bold,italic,underline,strikethrough,subscript,superscript,insertorderedlist,insertunorderedlist,unlink,'.contains(btn.toLowerCase()+',')
				
				var properties = Object.append({
					href:'javascript:void(0)',
					unselectable:(input || textarea ? 'off' : 'on'),
					title: btn + (val.shortcut ? ' (Ctrl+'+val.shortcut.capitalize()+')':''),	
					styles: val.img ? (isNaN(val.img) ? {'background-image':'url('+val.img+')'} : {'background-position':'0 '+(-20*val.img)+'px'}):{},
					events:{
						mousedown: function(e){
						   /* 	bar is the RTE - the toolbar parent [contains the class 'MooRTE'];
							* 	
							*	There is no way to move a button from one RTE to another. To facilitate such an option, one would use:
							* 	var bar = MooRTE.activeBar = this.getParent('.MooRTE')
							* 	So that bar will map to its own local variable, checked each time the button is pressed.
							*/
							MooRTE.activeBar = bar;
							var source = bar.retrieve('source')
							  , fields = bar.retrieve('fields');
							  
						   /* 	We must check that selected text is under the control of the button being clicked. 
							*	Otherwise, the whole page would become editable, including non-editable text and non-active fields.
							*
							*	First step is to find the element that contains the selection.
							*	Should be:
							*	if (!MooRTE.activeField.contains(MooRTE.Range.parent())) fields[0].focus();....
							* 	Workaround for https://mootools.lighthouseapp.com/projects/2706/tickets/1113-contains-not-including-textnodes
							*	"holder" is a reference to the node that includes all selected text. 
							*	Will be a text node or an element, depending on what is actually selected.
							*/
							var holder = MooRTE.Range.parent();
							// 	If using webkit, we need an element, as text nodes are not officially "contained": bug #1113
							// 	(nodeType == 3) means we have a text node. "parentElement" is a Webkit-specific property.
							if (Browser.webkit && holder.nodeType == 3) holder = holder.parentElement;
							
							/*	Second step is just to check if holder is within one of the fields:
							*	if (!fields.some(function(field){ return field.contains(holder) }))	fields[0].focus();
							*
							*	However that would require a DOM checking for every single field, every time a button is clicked.
							*	Instead, we assume that activeField would be set if the field was editable.
							*/
							if (!(fields.contains(MooRTE.activeField) && MooRTE.activeField.contains(holder))){ 
								fields[0].focus();
								MooRTE.activeField = fields[0];
							}								
						   /*	It is theroetically possible to have a selection without ever calling focus, or to have had activeField reset by JS.
						    *	If we wanted to check for that, but not run the loop of checking each field for holder, we could combine them, by:
						    *	Add the following to the end of the 'if' above:
						    *	&& !fields.some(function(field){ if (field.contains(holder)) return MooRTE.activeField = field; }
							*/
							
						   /*	If the button is passed an event, stop the event from propogating. 
							* 	If button is meant to accept input, the event must continue or the cursor will not appear. 
							*/
							if (e && e.stop) input || textarea ? e.stopPropagation() : e.stop();
							// If element has no onClick event, no [source ??], and is an 'a' element [or undefined/default] -   
							val.onClick && !source && (!val.element || val.element == 'a')
								? MooRTE.Utilities.exec(val.args || btn)
								// If it has a source, run that. If it has an onClick event, run that.
								: MooRTE.Utilities.eventHandler(source || 'onClick', this, btn);
						}
					}
				}, val);
				
				// The MooRTE.btnVals array contains all properties that are NOT added to the element being created.
				// For example, if this is not IE, "unselectable=on" is not needed.
				// Check if href should be removed. , but do not save the MooRTE array with the change, as this is element specific.
				MooRTE.btnVals[val.element ? 'include' : 'erase']('href')
				// include/erase returns a temporary array. We do not save this array, as href is element specific.
				// For each item in this temporary array, we delete the corresponding key in the properties array.
					.each(function(key){
						delete properties[key];
					});
					
				if (val.shortcut) parent.retrieve('shortcuts',$H({})).set(val.shortcut,btn);
				MooRTE.Utilities.eventHandler('onLoad', e, btn);
				if (btnVals) MooRTE.Utilities.addElements(btnVals, e);
				else if (val.contains) MooRTE.Utilities.addElements(val.contains, e);
				//if (collection.getCoordinates().top < 0)toolbar.addClass('rteTopDown'); //untested!!
			}
			e.removeClass('rteHide')
		})
			
	},
	
	, eventHandler: function(onEvent, caller, name){
		// UNTESTED: Function completely rewritten for v1.3
		// Must check if function or string is modified now that unlink is gone. Should be OK.
		
		/* ToDo:
		*	If array, assume multiple method references.
		*	If object, and value is an array, pass in as multpile arguments.
		*/
		
		var event = MooRTE.Elements[name][onEvent];
		switch(typeOf(event)){
			case 'function':
				event.call(caller, name, onEvent); break;
			case 'array': 
				// Deprecated, for backwards compatibility only.
				// Formerly same as object, but where first item in array was name of method.
				// Now allows for a number of events to be combined.
				// Untested, experimental, likely to be deprecated entirely.
				event = Array.clone(event);
				event.push(name, onEvent);
				MooRTE.Utilities[event.shift()].apply(caller, event); break;
			case 'object':
				Object.every(event, function(val,key){
					// key - the function name, eg. "group". val - the arguments, eg "{Toolbar:['start','Html/Text']}"
					// name - the key in the Elements array, eg "View", onEvent - the event, eg."onClick"
					val = Type.isArray(val) ? Array.clone(val) : Type.isObject(val) ? Object.clone(val) : val;
					MooRTE.Utilities[key].apply(caller, [val,name,onEvent]);
				}); break;
			case 'string':
				onEvent == 'source' && onEvent.substr(0,2) != 'on'
					? MooRTE.Range.wrapText(event, caller)
					: MooRTE.Utilities.eventHandler(event, caller, name);
		}
	/*
	*	function:
	*		a. Inserts an element with a series of sub elements
	*		b. Optionally links elements so that when one shows the others are hidden.
	*	arguments:
	*		elements[mixed] - The elements to add, as string/JSON/Array/Object.
	*		name[string] - the MooRTE.Elements that created 'this'. eg: "Main", referring to MooRTE.Elements.Main 
	*	this: refers to the element that was pressed to trigger the 'group' method, & which contains the group method in its onClick/onLoad property.
	*	returns: false
	*
	*	Adds a class to the button triggering the group .rteAdd_+name
	*	Calls the onShow eventhandler. By default, this is empty, but it can be configured by any plugin.
	*	Calls addElements. Adds all elements and gives the topmost a class of .rteGroup_+name. 
	*		eg. {group:'div.Flyout:[btn]'} will create <div class="rteGroup_div rteFlyout"><a class="rtebtn"></a></div> 
	*		ToDo: Elements is added to whichever parent of 'this' is part of a group. Not sure what my logic was.
	*	
	*	This function will also hide other groups if either of the two conditions are met:
	*		a. MooRTE.Elements[name] has an attribute 'hides'.
	*			eg. MooRTE.Elements.Main has a hides:'div'. When Main is clicked it will show the group attached to it, and hide the els specified in hides.
	* 		b. 'this' has siblings that also have created groups.
	*			The crazy logic here is that if you have two items which trigger the showing of groups, they are probably tabs.
	*			otherwise, you would have just included the submenu using 'contains'.
	*			This logic isn't logical, and should be fixed before v0.6
	*	ToDo: concept, perhaps eventHandler should allow an array/object of functions to be run, and hides will be a seperate function when hides is specified alongside group
	*		Also, eventHandler should allow multiple arguments, no?!
	*
	*
	*/
	group: function(elements, name){
		var self = this, parent = this.getParent('.RTE');
		(MooRTE.Elements[name].hides||self.getSiblings('*[class*=rteAdd]')).each(function(el){
			el.removeClass('rteSelected');
			parent.getFirst('.rteGroup_'+(el.get('class').match(/rteAdd([^ ]+?)\b/)[1])).addClass('rteHide');	//In the siteroller php selector engine, one can get a class that begins with a string by combining characters - caller.getSiblings('[class~^=rteAdd]').  Unfortunately, Moo does not support this!
			MooRTE.Utilities.eventHandler('onHide', self, name);
		});
		
		// Should be able to add the two classes together, but duplicates each time method runs. 
		// It appears to be the underscore that borks it. Mootools bug. Needs verification and Lighthouse listing.
		// this.addClass('rteSelected rteGroupBtn_'+name);
		this.addClass('rteSelected').addClass('rteGroupBtn_'+name);
		MooRTE.Utilities.addElements(elements, this.getParent('[class*=rteGroup_]'), 'after', 'rteGroup_'+name);
		MooRTE.Utilities.eventHandler('onShow', this, name);	
	}
  /* tabs method, replaces group method:
	*	arguments:
	*		(req) elements[object] - The items from MooRTE.Elements to add. Passed to addElements, conventions are same.
	*		(req) name[string] - The name of this Group/GroupBtn combination.  Added
	*		(req) tabGroup[string]
	*		(opt) place[object reference]
	*	this: element being clicked.
	*	returns: null
	*	overview: 
	*		Tabs consist of a number of related Group/GroupBtn pairs.
	*		When a GroupBtn is pressed, its corresponding Group shows, and all related Groups are hidden.
	*		The first time a Group/GroupBtn is passed in, it is created and added to the MooRTE.tabs array
	*	Notes:
	*		'hides', which can be set on any element in Elements, and which group would hide when element pressed, has been deprecated.
	*			No backwards support for this, and nothing stands ion its place.
	*
	
	* Revised tabs method on May 20, '12. Not backwards cmpatible.
	*  arguments:
	*		(req) tabGroup[string] - Name of group of tabs
	*		(opt) elements[mixed] - Content elements to be shown when tab is selected.
	*		(opt) options[object]:
	*			place [mixed] - element or MooRTE.Elements[<key>] of element within MooRTE object into which content should be added.
	*				place must exist before being called!
	*			'onExpand','onHide','onShow','onUpdate'[functions] - events
	*			ToDo: selfClose[bool, false] - true if clicking the tab a second time should deselect itself. 
	*	this: element being clicked.
	*	returns: null
	*	overview:
	*		Each TabGroup can consist of several tabs; when one is clicked, it gets .rteSelected.
	*		Each tab can (optionally) have a related content element, which is hid/shown as the tab is de/selected.		
	*/
	, tabs: function(elements, name, tabGroup, place){
	  /*	ToDo: Change the preset arguments to be first in list when calling methods.
		*		This will allow the number of arguments to be not set in advance.  May be less intuitive, should try to find Mootools precedence.
		*		Till then, tabGroup and place is assumed to be the passed in items, and crashes.
		*/
		tabGroup = 'tabs1';
			
		MooRTE.btnVals.combine(['onExpand','onHide','onShow','onUpdate']);
		
		Object.each(MooRTE.Tabs[tabGroup], function(els, title){
			els[0].removeClass('rteSelected');
			els[1].addClass('rteHide');
			MooRTE.Utilities.eventHandler('onHide', this, name);
		}, this);
		
		this.addClass('rteSelected rteGroupBtn_'+name);
		var group = MooRTE.Utilities.addElements(elements, place, {className:'rteGroup_'+name, ifExists:'stop'});
		MooRTE.Utilities.eventHandler('onShow', this, name);
		
		if (!MooRTE.Tabs[tabGroup]) MooRTE.Tabs[tabGroup] = {};
		if (!MooRTE.Tabs[tabGroup][name]) MooRTE.Tabs[tabGroup][name] = [this, group]//Object.set(name, );
	}
	/* addTabs - arguments:
		(req) tabGroup[string] - name of group of tabs.
				tabName[string] - If content (not a tab), the key, in MooRTE.Elements, of the element that will be the tab of said content.
					If tab, this argument is ignored (ie. optional). Will overwrite existing content.
		this: Element that calls the function
		returns: null
		overview:
			Allows one to add a tab or content-of-a-tab to the Tabs array wthout immediately displaying it.
	*/
	, addTab: function(tabGroup, tabName){
		if (!MooRTE.Tabs[tabGroup]) MooRTE.Tabs[tabGroup] = {};
		if (!MooRTE.Tabs[tabGroup][tabName]) MooRTE.Tabs[tabGroup][tabName] = [];
		MooRTE.Tabs[tabGroup][tabName][+(tabName == Array.from(arguments).splice(-2,1))] = this;
		}

	, assetLoader:function(args){
		
		if(MooRTE.Utilities.assetLoader.busy) return MooRTE.Utilities.assetLoader.delay(750,this,args);
		var head = $$('head')[0], path = MooRTE.path.slice(0,-1), path = path.slice(0, path.lastIndexOf('/')+1), path = MooRTE.pluginpath||path, me = args.me;// + (args.folder || '')
		if(args.me) Hash.erase(MooRTE.Elements[args.me], 'onLoad');
		
		var hrefs = head.getElements('link').map(function(el){return el.get('href')});
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
		}
		var aborted = function(){
			MooRTE.Utilities.assetLoader.busy = false;
		}
		if(args.scripts){
			var last = args.scripts.length, count=0;
			$splat(args.scripts).each(function(file){
				++count == last && args.onComplete ?  Asset.javascript(path+file, {onload:loaded, onabort:aborted}) : Asset.javascript(path+file);
			});
		}
		
		/* new Loader({scripts:$splat(path+js), onComplete:onload, styles:$splat(path+css)});
		   $splat(js).each(function(file){ Asset.javascript(path+file,{'onload':onload.bind(self)}	);})//+'?a='+Math.random()//(file==$splat(js).getLast() && onload ? onload : $empty)});	//,{ onload:(onload||$empty) }Array.getLast(js)		
		*/
	},
	
	clipStickyWin: function(caller){
		if (Browser.Engine.gecko || (Browser.Engine.webkit && caller=='paste')) 
			MooRTE.Utilities.assetLoader({
				me: this,
				scripts: ['stickywin/clientcide.moore.js'],
				onComplete: function(command){
					var body = "For your protection, "+(Browser.Engine.webkit?"Webkit":"Firefox")+" does not allow access to the clipboard.<br/>  <b>Please use Ctrl+C to copy, Ctrl+X to cut, and Ctrl+V to paste.</b><br/>\
						(Those lucky enough to be on a Mac use Cmd instead of Ctrl.)<br/><br/>\
						If this functionality is important, consider switching to a browser such as IE,<br/> which will allow us to easily access [and modify] your system."; 
					MooRTE.Elements.clipPop = new StickyWin.Modal({content: StickyWin.ui('Security Restriction', body, {buttons:[{ text:'close'}]})});	
					MooRTE.Elements.clipPop.hide();
				}
			});
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
		
		// In order to clean the content, we copy it into a div.  If an element is passed it, we just use that element.
		// washer will be the element whose text is being cleaned, html is the text to clean.
		
		var washer;
		// If an element was passed in, call it washer & its content html.
		if($type(html)=='element'){
			washer = html;
			
			// Remove the RTE from the element so that it doesn't get cleaned out and sent.
			// This is only needed if the RTE is within the element we want to clean, so we check for that. 
			// It now checks if the RTE is the first element.  Checking if the RTE is contained anywhere in washer would be safer, but I cant think where it would be needed.
			if(washer.getFirst() == washer.retrieve('bar')) washer.moorte('remove');
			
		// Otherwise, call the passed in content html, and put it into its own container called washer.
		// If this function has been run before washer exists, do not recreate.
		} else washer = $('washer') || new Element('div',{id:'washer'}).inject(document.body);
		
		// Cleanup step #1, using selectors to clean out what is possible to be cleaned.
		washer.getElements('p:empty'+(options.remove ? ','+options.remove : '')).destroy();
		// The following will not apply in Firefox, as it redraws the p's to surround the inner one with empty outer ones.  It should be tested for in other browsers.
		if(!Browser.Engine.gecko) washer.getElements('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) el.replaces(p)  });   
		// Cleanup step 2: use a regex for the remainder of the cleanup. Put content into a string 'html'
		html = washer.get('html');
		// Restore the RTE to the element if it had been removed.
		if(washer != $('washer')) washer.moorte();
		
		// Extend array of regexs according to passed in options.
		if(xhtml)cleanup.extend(xhtml);
		if(semantic)cleanup.extend(semantic);
		if(Browser.Engine.webkit)cleanup.extend(appleCleanup);
		
		// loop through regexs until content is returned the same way it went in. 
		// var loopStop = 0;  //while testing.
		do{	
			var cleaned = html;
			cleanup.each(function(reg){ html = html.replace(reg[0], reg[1]); });		
		} while (cleaned != html); // && ++loopStop <3
		
		// Trim off leading and trailing spaces and return HTML
		return html.trim();
	}
}

/* Overview:
*	1. If a RTE is passed in we set it to be the current RTE for all future operations.
*		Generally, this will be for 'attach' only.
*	2. If any of the four keywords are passed in ('destroy', 'remove', 'detach', 'hide'):
*		a. If the toolbar doesn't exist, or it has been removed, we exit. You cannot destroy a removed toolbar at the moment.
*		b. If it exists, we follow the instruction. If an object is passed in, it is ignored.
*	3. If not, check if a bar already exists. 
*		a. If not, create a brand new spanking toolbar. 
*		b. If yes, but has the class of hidden, show it and return.
*	5. Otherwise, if field is removed, restore it.
*	6. If not, it must be detached. Reattach it.
*
*	In all cases where an action would be applied to a RTE, one could pass in any element which is connected to the RTE.
*	eg: $('edit1').moorte('remove') - Will remove the RTE that controls $('edit1').
*	eg: $('edit1').moorte($('edit2')) - Will cause $('edit1') to attach itself to $('edit2')'s toolbar.
*/

/* 	ToDo:
* 	feature: if error[number], should pass back false or errorcode
* 	feature [may exist]: MooRTE should check if passed in element has a RTE already.
*/
MooRTE.extensions = function(){	//arguments: command, options

		// params - passed in arguments, sorted to be useful.
	var params = Array.link(arguments, {'options': Type.isObject, 'cmd': Type.isString, 'rte':Type.isElement})
		// cmd - What should be done: create, destroy, etc.
	, cmd = 'detach,hide,remove,destroy'.test(params.cmd,'i') ? params.cmd.toLowerCase() : '';

	// This should all work if the toolbar extends multiple elements and has been removed and restored.  Untested.	
	Array.from(this).every(function(self){

		var bar	// The RTE controlling this element. Can only be one.
		  , els // The elements that are affected by the bar. can be many.
		  , self = self.retrieve('new') || self; // The current element. If textarea/input, the div created to replace the textarea. 

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
			if (!bar) return new MooRTE(Object.merge(params.options || {}, {'elements':this})), false;
				// If bar exists, it must be on the page, but invisible. Otherwise, create a new instance of the RTE.
			else if (bar.hasClass('rteHide')) return bar.removeClass('rteHide');
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
				   /* The editor is structured that the RTE will either injected into 'this' (the default), or at the page bottom (if floating:false or position:fixed).
					* We therefore could assume that whenever there is no previous element, it should be injected in the top of this: 
					* 	 if(prev = bar.getPrevious())place = [prev,'after'];	And in the other half: if(rem = this.retrieve('removed')) rem.place ? bar.inject(rem.place, rem.where) : bar.inject(this, 'top');
					* If we want to cover cases where the user moved it somehow to the top of a different element, we could still do something like:
					*	 var place = bar.getPrevious() ? [bar.getPrevious(),'after'] : (bar.getParent != this ?  [bar.getParent(),'top'] : []); 
					* Considering that in most cases we will be storing on the element a reference to itself (by default the editor is the first child of 'this'), the current code is wasteful but safe.
					* The only potential downside is a memory leak due to the extra reference to element (which can prevent the element from being cleared from memory).  Seems inconsequential to me.
					* 
					* Store the previous element if exists, or the parent if no previous.  This will allow it to be returned later to the place from whence it came.
					*/
				bar.store('removed', bar.getPrevious()
						? [bar.getPrevious(),'after']
						: [bar.getParent(),'top']);
				   /* Remove the RTE from the DOM. Do not destroy it, or it cannot be later restored. Done in Moo 1.3 using dispose. 
					* Originally done as follows: new Element('span').replaces(bar).destroy(); break;
					*/
				bar.dispose();
				els = bar.retrieve('fields');
				break;			
			case 'destroy':
				els = bar.retrieve('fields');
				bar = bar.destroy();
				break;
			default:
					// assume we will act on current element
				els = [self]
				  , removed = bar.retrieve('removed');
					// If removed is defined, the element exists and is in memory.
				if (removed){
						// get the list of all elements that must be re-editabled
					els = bar.retrieve('fields');
						// inject the toolbar back onto the page.
					bar.inject(removed[0], removed[1]).eliminate('removed');
						// if bar, !hasClass(rteHide), and !removed, element must detached.
						// You cannot attach a bar to itself
				} else if (self == bar) return;
				
				els.each(function(el){
						
					bar.retrieve('fields').include(el);
					var src = el.retrieve('src');
					if (!src){
						el.set('contentEditable', true);
						MooRTE.Utilities.addEvents(el, el.retrieve('rteEvents'));
						if (Browser.firefox && !el.getElement('#rteMozFix')) el.grab(new Element('div', {id:'retMozFix', styles:{display:'none'}}));
					} else if (src.getParent()) el.set('html', src.get('value')).replaces(src);
				})
				return true;
		}
				
		els.each(function(el){
			if (Browser.firefox && el.getElement('#rteMozFix')) el.getElement('#rteMozFix').destroy();
				// Textareas must be replaced with a div. Get the textarea.
			var src = el.retrieve('src');
			if (src){
				// We used to check if src.getParent(), as if !src.parent, the textarea is not on the page, in which case we cannot replace it.
				// I dont recall when or why this became unnecessary.
				src.set('value', el.get('html')).replaces(el);
				if (!bar){
					src.eliminate('new');
					el.destroy();
				}
			} else {
				// Must not have been a textarea. Set contenteditable, restore events, add moz fix.
				el.set('contentEditable', false);
				MooRTE.Utilities.removeEvents(el, destroy);
				if (!bar) el.eliminate('bar');
			}
		});
		return true;
	}.bind(this));
	
	return this.retrieve(cmd ? 'src' : 'new') || this; 
}

Element.implement({moorte:MooRTE.extensions});
Elements.implement({moorte:MooRTE.extensions});

MooRTE.Elements = new Hash({

/*#*///	Groups (Flyouts) - Sample groups.  Groups are created dynamically by the download builder. 
/*#*/	Main			:{text:'Main',   'class':'rteText', onClick:'onLoad', onLoad:['group',{Toolbar:['start','bold','italic','underline','strikethrough','Justify','Lists','Indents','subscript','superscript']}] },//
/*#*/	File			:{text:'File',   'class':'rteText', onClick:['group',{Toolbar:['start','cut','copy','paste','redo','undo','selectall','removeformat']}] },
/*#*/	Font			:{text:'Font',   'class':'rteText', onClick:['group',{Toolbar:['start','fontSize']}] },
/*#*/	Insert			:{text:'Insert', 'class':'rteText', onClick:['group',{Toolbar:['start','hyperlink','inserthorizontalrule', 'blockquote']}] },//'Upload Photo'
/*#*/	View			:{text:'Views',  'class':'rteText', onClick:['group',{Toolbar:['start','Html/Text']}] },

/*#*///	Groups (Flyouts) - All groups should be created dynamically by the download builder. 
/*#*/	Justify			:{img:06, 'class':'Flyout rteSelected', contains:'div.Flyout:[justifyleft,justifycenter,justifyright,justifyfull]' },
/*#*/	Lists			:{img:14, 'class':'Flyout', contains:'div.Flyout:[insertorderedlist,insertunorderedlist]' },
/*#*/	Indents			:{img:11, 'class':'Flyout', contains:'div.Flyout:[indent,outdent]' },
	                
/*#*///	Buttons
/*#*/	div			 	:{element:'div'},
/*#*/	bold		 	:{img:1, shortcut:'b' },
/*#*/	italic		 	:{img:2, shortcut:'i' },
/*#*/	underline	 	:{img:3, shortcut:'u' },
/*#*/	strikethrough	:{img:4},
/*#*/	justifyleft	 	:{img:6, title:'Justify Left', onUpdate:function(cmd,val){
							var t = MooRTE.activeField.retrieve('bar').getElement('.rtejustify'+(val=='justify'?'full':val)); 
							t.getParent().getParent().setStyle('background-position', t.addClass('rteSelected').getStyle('background-position'));
						}},
/*#*/	justifyfull	 	:{img:7, title:'Justify Full'  },
/*#*/	justifycenter	:{img:8, title:'Justify Center'},
/*#*/	justifyright	:{img:9, title:'Justify Right' },
/*#*/	subscript		:{img:18},
/*#*/	superscript		:{img:17},
/*#*/	outdent			:{img:11},
/*#*/	indent			:{img:12},
/*#*/	insertorderedlist  :{img:14, title:'Numbered List' },
/*#*/	insertunorderedlist:{img:15, title:'Bulleted List' },
/*#*/	selectall   	:{img:25, title:'Select All (Ctrl + A)'},
/*#*/	removeformat	:{img:26, title:'Clear Formatting'},
/*#*/	undo        	:{img:31, title:'Undo (Ctrl + Z)' },
/*#*/	redo         	:{img:32, title:'Redo (Ctrl+Y)' },
/*#*/	decreasefontsize:{img:42},
/*#*/	increasefontsize:{img:41},	
/*#*/	inserthorizontalrule:{img:56, title:'Insert Horizontal Line' },
/*#*/	cut				:{ img:20, title:'Cut (Ctrl+X)', onLoad:MooRTE.Utilities.clipStickyWin,
							onClick:function(action){ Browser.Engine.gecko ? MooRTE.Elements.clipPop.show() : MooRTE.Utilities.exec(action); }
						},
/*#*/	copy        	:{ img:21, title:'Copy (Ctrl+C)', onLoad:MooRTE.Utilities.clipStickyWin,
							onClick:function(action){ Browser.Engine.gecko ? MooRTE.Elements.clipPop.show() : MooRTE.Utilities.exec(action); }
						},
/*#*/	paste       	:{img:22, title:'Paste (Ctrl+V)', onLoad:MooRTE.Utilities.clipStickyWin, //onLoad:function() { MooRTE.Utilities.clipStickyWin(1) },
							onClick:function(action){ Browser.Engine.gecko || Browser.Engine.webkit ? MooRTE.Elements.clipPop.show() : MooRTE.Utilities.exec(action); }
						},
/*#*/	save			:{ img:'11', src:'saveFile.php', onClick:function(){
							var content = $H({ 'page': window.location.pathname });
							this.getParent('.MooRTE').retrieve('fields').each(function(el){
								content['content_'+(el.get('id')||'')] = MooRTE.Utilities.clean(el);
							});
							new Request({url:MooRTE.Elements.save.src}).send(content.toQueryString());
						}},
/*#*/	'Html/Text'		:{ img:'26', onClick:['DisplayHTML']}, 
/*#*/	DisplayHTML		:{ element:'textarea', 'class':'displayHtml', unselectable:'off', init:function(){ 
							var el=this.getParent('.MooRTE').retrieve('fields'), p = el.getParent(); 
							var size = (p.hasClass('rteTextArea') ? p : el).getSize(); 
							this.set({'styles':{width:size.x, height:size.y}, 'text':el.innerHTML.trim()})
						}},
/*#*/	colorpicker		:{ 'element':'img', 'src':'images/colorPicker.jpg', 'class':'colorPicker', onClick:function(){
							//c[i] = ((hue - brightness) * saturation + brightness) * 255;  hue=angle of ColorWheel.  saturation =percent of radius, brightness = scrollWheel.
							//for(i=0;i<3;i++) c[i] = ((((h=Math.abs(++hue)) < 1 ? 1 : h > 2 ? 0 : -(h-2)) - brightness) * saturation + brightness) * 255;  
							//c[1] = -(c[2] - 255*saturation);var hex = c.rgbToHex();
							//var c, radius = this.getSize().x/2, x = mouse.x - radius, y = mouse.y - radius, brightness = hue.y / hue.getSize().y, hue = Math.atan2(x,y)/Math.PI * 3 - 2, saturation = Math.sqrt(x*x+y*y) / radius;
							var c, radius = this.getSize().x/2, x = mouse.x - radius, y = mouse.y - radius, brightness = hue.y / hue.getSize().y, hue = Math.atan2(x,y)/Math.PI * 3 + 1, saturation = Math.sqrt(x*x+y*y) / radius;
							for(var i=0;i<3;i++) c[i] = (((Math.abs((hue+=2)%6 - 3) < 1 ? 1 : h > 2 ? 0 : -(h-2)) - brightness) * saturation + brightness) * 255;  
							var hex = [c[0],c[2],c[1]].rgbToHex();
						}},
/*#*/	hyperlink		:{ img:46, title:'Create hyperlink', 
							onClick:function(){
									MooRTE.Range.create();
									$('popTXT').set('value',MooRTE.Range.get('text', MooRTE.ranges.a1));
									MooRTE.Elements.linkPop.show();
							},
							onLoad: function(){
								MooRTE.Utilities.assetLoader({
									me: this,
									scripts: ['stickywin/clientcide.moore.js'],
									onComplete: function(){
										var body = "<span style='display:inline-block; width:100px'>Text of Link:</span><input id='popTXT'/><br/>\
													<span style='display:inline-block; width:100px'>Link To Location:</span><input id='popURL'/><br/>\
													<input type='radio' name='pURL'  value='web' checked/>Web<input type='radio' name='pURL' id='pURL1' value='email'/>Email";
										var buttons = [ 
											{ text:'cancel' },
											{ text:'OK',
												onClick:function(){
												//	if(me.getParent('.MooRTE').hasClass('rteHide'))MooRTE.ranges.a1.commonAncestorContainer.set('contenteditable',true);
													MooRTE.Range.set();
													var value = $('popURL').get('value');
													if($('pURL1').get('checked')) value = 'mailto:'+value;
													MooRTE.Utilities.exec(value ? 'createlink' : 'unlink', value); 
												} 
											}
										];
										MooRTE.Elements.linkPop = new StickyWin.Modal({content: StickyWin.ui('Edit Link', body, {buttons:buttons})});	
										MooRTE.Elements.linkPop.hide();
							}	})	}	
						},  // Ah, but its a shame this ain't LISP ;) ))))))))))!
/*#*/	'Upload Photo' :{ img:15, 
							onLoad:function(){
								MooRTE.Utilities.assetLoader({ //new Loader({
									scripts: ['/siteroller/classes/fancyupload/fancyupload/source/Swiff.Uploader.js'], 
									styles:  ['/siteroller/classes/fancyupload/fancyupload/source/Swiff.Uploader.css'], 
									onComplete:function(){
										var uploader = new Swiff.Uploader({
											verbose: true, 
											target:this, queued: false, multiple: false, instantStart: true, fieldName:'photoupload', 
											typeFilter: { 'Images (*.jpg, *.jpeg, *.gif, *.png)': '*.jpg; *.jpeg; *.gif; *.png'	},
											path: '/siteroller/classes/fancyupload/fancyupload/source/Swiff.Uploader.swf',
											url: '/siteroller/classes/moorte/source/plugins/fancyUpload/uploadHandler.php',
											onButtonDown :function(){ MooRTE.Range.set() },
											onButtonEnter :function(){ MooRTE.Range.create() },
											onFileProgress: function(val){  },//self.set('text',val);
											onFileComplete: function(args){ MooRTE.Range.set().exec('insertimage',JSON.decode(args.response.text).file) }
										});
										this.addEvent('mouseenter',function(){ uploader.target = this; uploader.reposition(); })
									}
								})
							}							
						},
/*#*/	blockquote		:{	img:52, onClick:function(){	MooRTE.Range.wrap('blockquote'); } },
/*#*/	start			:{element:'span'},

/*#*///	depracated
/*#*/	'Menu'         :{element:'div'},  //div.Menu would create the same div (with a class of rteMenu).  But since it is the default, I dont wish to confuse people...
/*#*/	'Toolbar'      :{element:'div'},  // ''
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
});

/*	ToDo: Should support be added to have methods that run only on firstClick?
*		One way this can be done is creating another Elements object on each bar, that is only populated when directly told to.
*		When a button is added or method is called and the item is in the element-specific-Elements-array, and will use that instead of the main Elements Object.
*		Then firstClick can be added when desired, as well as allowing a button to have specific uses, such as one editor on a page being Markup.
*/		