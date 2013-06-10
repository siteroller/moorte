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