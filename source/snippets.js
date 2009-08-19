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