/*
 * Fx.ProgressBar
 * @version		1.0
 * @license		MIT License
 * @author		Harald Kirschner <mail [at] digitarald [dot] de>
 * @copyright	Authors
 */
Fx.ProgressBar = new Class({

	Extends: Fx,

	options: {
		text: null,
		transition: Fx.Transitions.Circ.easeOut,
		link: 'cancel'
	},

	initialize: function(element, options) {
		this.element = $(element);
		this.parent(options);
		this.text = $(this.options.text);
		this.set(0);
	},

	start: function(to, total) {
		return this.parent(this.now, (arguments.length == 1) ? to.limit(0, 100) : to / total * 100);
	},

	set: function(to) {
		this.now = to;
		this.element.setStyle('backgroundPosition', (100 - to) + '% 0px');
		if (this.text) this.text.set('text', Math.round(to) + '%');
		return this;
	}

});

/*
 * Swiff.Uploader - Flash FileReference Control
 * @version		1.2
 * @license		MIT License
 * @author		Harald Kirschner <mail [at] digitarald [dot] de>
 * @copyright	Authors
 */

Swiff.Uploader = new Class({

	Extends: Swiff,

	Implements: Events,

	options: {
		path: 'Swiff.Uploader.swf',
		multiple: true,
		queued: true,
		typeFilter: null,
		url: null,
		method: 'post',
		data: null,
		fieldName: 'Filedata',
		target: null,
		height: '100%',
		width: '100%',
		callBacks: null
	},

	initialize: function(options){
		if (Browser.Plugins.Flash.version < 9) return false;
		this.setOptions(options);

		var callBacks = this.options.callBacks || this;
		if (callBacks.onLoad) this.addEvent('onLoad', callBacks.onLoad);
		if (!callBacks.onBrowse) {
			callBacks.onBrowse = function() {
				return this.options.typeFilter;
			}
		}

		var prepare = {}, self = this;
		['onBrowse', 'onSelect', 'onAllSelect', 'onCancel', 'onBeforeOpen', 'onOpen', 'onProgress', 'onComplete', 'onError', 'onAllComplete'].each(function(index) {
			var fn = callBacks[index] || $empty;
			prepare[index] = function() {
				self.fireEvent(index, arguments, 10);
				return fn.apply(self, arguments);
			};
		});

		prepare.onLoad = this.load.create({delay: 10, bind: this});
		this.options.callBacks = prepare;

		var path = this.options.path;
		if (!path.contains('?')) path += '?noCache=' + $time(); // quick fix

		this.parent(path);

		var scroll = window.getScroll();
		this.box = new Element('div', {
			id:'fancyUploadSwiff',
			styles: {
				position: 'absolute',
				visibility: 'visible',
				zIndex: 9999,
				overflow: 'hidden',
				height: 15, width: 15,
				top: scroll.y, left: scroll.x
			}
		});
		this.inject(this.box);
		this.box.inject($(this.options.container) || document.body);

		return this;
	},

	load: function(){
		this.remote('register', this.instance, this.options.multiple, this.options.queued);
		this.fireEvent('onLoad');

		this.target = $(this.options.target);
		if (Browser.Plugins.Flash.version >= 10 && this.target) {
			this.reposition();
			window.addEvent('resize', this.reposition.bind(this));
		}
	},

	reposition: function() {
		var pos = this.target.getCoordinates(this.box.getOffsetParent());
		this.box.setStyles(pos);
	},

	/*
	Method: browse
		Open the file browser.
	*/

	browse: function(typeFilter){
		this.options.typeFilter = $pick(typeFilter, this.options.typeFilter);
		return this.remote('browse');
	},

	/*
	Method: upload
		Starts the upload of all selected files.
	*/

	upload: function(options){
		var current = this.options;
		options = $extend({data: current.data, url: current.url, method: current.method, fieldName: current.fieldName}, options);
		if ($type(options.data) == 'element') options.data = $(options.data).toQueryString();
		return this.remote('upload', options);
	},

	/*
	Method: removeFile
		For multiple uploads cancels and removes the given file from queue.

	Arguments:
		name - (string) Filename
		name - (string) Filesize in byte
	*/

	removeFile: function(file){
		if (file) file = {name: file.name, size: file.size};
		return this.remote('removeFile', file);
	},

	/*
	Method: getFileList
		Returns one Array with with arrays containing name and size of the file.

	Returns:
		(array) An array with files
	*/

	getFileList: function(){
		return this.remote('getFileList');
	}

});

/*
 * FancyUpload - Flash meets Ajax for powerful and elegant uploads.
 * @version		2.1
 * @license		MIT License
 * @author		Harald Kirschner <mail [at] digitarald [dot] de>
 * @copyright	Authors
 */

var FancyUpload2 = new Class({

	Extends: Swiff.Uploader,

	options: {
		limitSize: false,
		limitFiles: 5,
		instantStart: false,
		allowDuplicates: false,
		validateFile: $lambda(true), // provide a function that returns true for valid and false for invalid files.
		debug: false,

		fileInvalid: null, // called for invalid files with error stack as 2nd argument
		fileCreate: null, // creates file element after select
		fileUpload: null, // called when file is opened for upload, allows to modify the upload options (2nd argument) for every upload
		fileComplete: null, // updates the file element to completed state and gets the response (2nd argument)
		fileRemove: null // removes the element
		/**
		 * Events:
		 * onBrowse, onSelect, onAllSelect, onCancel, onBeforeOpen, onOpen, onProgress, onComplete, onError, onAllComplete
		 */
	},

	initialize: function(status, list, options) {
		this.status = $(status);
		this.list = $(list);

		this.files = [];

		if (options.callBacks) {
			this.addEvents(options.callBacks);
			options.callBacks = null;
		}

		this.parent(options);
		this.render();
		//console.log('init1')
	},

	render: function() {
	
		this.overallTitle = this.status.getElement('.overall-title');
		this.currentTitle = this.status.getElement('.current-title');
		this.currentText = this.status.getElement('.current-text');

		var progress = this.status.getElement('.overall-progress');
// !		console.log(progress);
		this.overallProgress = new Fx.ProgressBar(progress, {
			text: new Element('span', {'class': 'progress-text'}).inject(progress, 'after')
		});
// !		console.log('not here')
		progress = this.status.getElement('.current-progress')
		this.currentProgress = new Fx.ProgressBar(progress, {
			text: new Element('span', {'class': 'progress-text'}).inject(progress, 'after')
		});
		
	},

	onLoad: function() {
		this.log('Uploader ready!');
	},

	onBeforeOpen: function(file, options) {
		this.log('Initialize upload for "{name}".', file);
		var fn = this.options.fileUpload;
		var obj = (fn) ? fn.call(this, this.getFile(file), options) : options;
		return obj;
	},

	onOpen: function(file, overall) {
		this.log('Starting upload "{name}".', file);
		file = this.getFile(file);
		file.element.addClass('file-uploading');
		this.currentProgress.cancel().set(0);
		this.currentTitle.set('html', 'File Progress "{name}"'.substitute(file) );
	},

	onProgress: function(file, current, overall) {
		this.overallProgress.start(overall.bytesLoaded, overall.bytesTotal);
		this.currentText.set('html', 'Upload with {rate}/s. Time left: ~{timeLeft}'.substitute({
			rate: (current.rate) ? this.sizeToKB(current.rate) : '- B',
			timeLeft: Date.fancyDuration(current.timeLeft || 0)
		}));
		this.currentProgress.start(current.bytesLoaded, current.bytesTotal);
	},

	onSelect: function(file, index, length) {
		var errors = [];
		if (this.options.limitSize && (file.size > this.options.limitSize)) errors.push('size');
		if (this.options.limitFiles && (this.countFiles() >= this.options.limitFiles)) errors.push('length');
		if (!this.options.allowDuplicates && this.getFile(file)) errors.push('duplicate');
		if (!this.options.validateFile.call(this, file, errors)) errors.push('custom');
		if (errors.length) {
			var fn = this.options.fileInvalid;
			if (fn) fn.call(this, file, errors);
			return false;
		}
		(this.options.fileCreate || this.fileCreate).call(this, file);
		this.files.push(file);
		return true;
	},

	onAllSelect: function(files, current, overall) {
		this.log('Added ' + files.length + ' files, now we have (' + current.bytesTotal + ' bytes).', arguments);
		this.updateOverall(current.bytesTotal);
		this.status.removeClass('status-browsing');
		if (this.files.length && this.options.instantStart) this.upload.delay(10, this);
	},

	onComplete: function(file, response) {
		this.log('Completed upload "' + file.name + '".', arguments);
		this.currentText.set('html', 'Upload complete!');
		this.currentProgress.start(100);
		(this.options.fileComplete || this.fileComplete).call(this, this.finishFile(file), response);
	},

	onError: function(file, error, info) {
		this.log('Upload "' + file.name + '" failed. "{1}": "{2}".', arguments);
		(this.options.fileError || this.fileError).call(this, this.finishFile(file), error, info);
	},

	onCancel: function() {
		this.log('Filebrowser cancelled.', arguments);
		this.status.removeClass('file-browsing');
	},

	onAllComplete: function(current) {
		this.log('Completed all files, ' + current.bytesTotal + ' bytes.', arguments);
		this.updateOverall(current.bytesTotal);
		this.overallProgress.start(100);
		this.status.removeClass('file-uploading');
	},

	browse: function(fileList) {
		var ret = this.parent(fileList);
		if (ret !== true){
			if (ret) this.log('An error occured: ' + ret);
			else this.log('Browse in progress.');
		} else {
			this.log('Browse started.');
			this.status.addClass('file-browsing');
		}
	},

	upload: function(options) {
		var ret = this.parent(options);
		if (ret !== true) {
			this.log('Upload in progress or nothing to upload.');
			if (ret) alert(ret);
		} else {
			this.log('Upload started.');
			this.status.addClass('file-uploading');
			this.overallProgress.set(0);
		}
	},

	removeFile: function(file) {
		var remove = this.options.fileRemove || this.fileRemove;
		if (!file) {
			this.files.each(remove, this);
			this.files.empty();
			this.updateOverall(0);
		} else {
			if (!file.element) file = this.getFile(file);
			this.files.erase(file);
			remove.call(this, file);
			this.updateOverall(this.bytesTotal - file.size);
		}
		this.parent(file);
	},

	getFile: function(file) {
		var ret = null;
		this.files.some(function(value) {
			if ((value.name != file.name) || (value.size != file.size)) return false;
			ret = value;
			return true;
		});
		return ret;
	},

	countFiles: function() {
		var ret = 0;
		for (var i = 0, j = this.files.length; i < j; i++) {
			if (!this.files[i].finished) ret++;
		}
		return ret;
	},

	updateOverall: function(bytesTotal) {
		this.bytesTotal = bytesTotal;
		this.overallTitle.set('html', 'Overall Progress (' + this.sizeToKB(bytesTotal) + ')');
	},

	finishFile: function(file) {
		file = this.getFile(file);
		file.element.removeClass('file-uploading');
		file.finished = true;
		return file;
	},

	fileCreate: function(file) {
		file.info = new Element('span', {'class': 'file-info'});
		file.element = new Element('li', {'class': 'file'}).adopt(
			new Element('span', {'class': 'file-size', 'html': this.sizeToKB(file.size)}),
			new Element('a', {
				'class': 'file-remove',
				'href': '#',
				'html': 'Remove',
				'events': {
					'click': function() {
						this.removeFile(file);
						return false;
					}.bind(this)
				}
			}),
			new Element('span', {'class': 'file-name', 'html': file.name}),
			file.info
		).inject(this.list);
	},

	fileComplete: function(file, response) {
		this.options.processResponse || this
		var json = $H(JSON.decode(response, true));
		if (json.get('result') == 'success') {
			file.element.addClass('file-success');
			file.info.set('html', json.get('size'));
		} else {
			file.element.addClass('file-failed');
			file.info.set('html', json.get('error') || response);
		}
	},

	fileError: function(file, error, info) {
		file.element.addClass('file-failed');
		file.info.set('html', '<strong>' + error + '</strong><br />' + info);
	},

	fileRemove: function(file) {
		file.element.fade('out').retrieve('tween').chain(Element.destroy.bind(Element, file.element));
	},

	sizeToKB: function(size) {
		var unit = 'B';
		if ((size / 1048576) > 1) {
			unit = 'MB';
			size /= 1048576;
		} else if ((size / 1024) > 1) {
			unit = 'kB';
			size /= 1024;
		}
		return size.round(1) + ' ' + unit;
	},

	log: function(text, args) {
		if (this.options.debug && window.console) console.log(text.substitute(args || {}));
	}

});

/**
 * @todo Clean-up, into Date.js
 */
Date.parseDuration = function(sec) {
	var units = {}, conv = Date.durations;
	for (var unit in conv) {
		var value = Math.floor(sec / conv[unit]);
		if (value) {
			units[unit] = value;
			if (!(sec -= value * conv[unit])) break;
		}
	}
	return units;
};

Date.fancyDuration = function(sec) {
	var ret = [], units = Date.parseDuration(sec);
	for (var unit in units) ret.push(units[unit] + Date.durationsAbbr[unit]);
	return ret.join(', ');
};

Date.durations = {years: 31556926, months: 2629743.83, days: 86400, hours: 3600, minutes: 60, seconds: 1, milliseconds: 0.001};
Date.durationsAbbr = {
	years: 'j',
	months: 'm',
	days: 'd',
	hours: 'h',
	minutes: 'min',
	seconds: 'sec',
	milliseconds: 'ms'
};



//######################################################

function applyUploader(){

	var swiffy = new FancyUpload2($('fuStatus'), $('fuList'), {
		url: 'uploadHandler.php',
		fieldName: 'photoupload',
		path: '../moorte/plugins/fancyUpload/Swiff.Uploader.swf',
		//path: new URI($$('script[src*=moorte.js]')[0].get('src')).get('directory')+'plugins/fancyUpload/Swiff.Uploader.swf',
		limitSize: 2 * 1024 * 1024,
		typeFilter:{'Images (*.jpg, *.jpeg, *.gif, *.png)': '*.jpg; *.jpeg; *.gif; *.png'},
		onLoad: function() {
			// MooRTE.Utilities.storeRange('insertImage');
			// $('fuStatus').removeClass('hide');  $('demo-fallback').destroy();
		},
		onComplete: function(file, response){
			// console.log($A(arguments))
			// MooRTE.Utilities.setRange('insertImage');
			response = JSON.decode(response);
			if(response.file) MooRTE.Utilities.exec("insertimage", response.file);
		},
		debug: true, 		// enable logs, uses console.log
		target: 'fuBrowse' 	// the element for the overlay (Flash 10 only).  Not used since we anyways use our own method.
	});
	
			
	$('fuBrowse').addEvent('mousedown', function() {	// Doesn't work anymore with Flash 10: swiffy.browse(); FancyUpload moves the Flash movie as overlay over the link(see "target" option above)
		swiffy.browse();
		return false;
	});

	$('fuClear').addEvent('mousedown', function() {
		swiffy.removeFile();
		return false;
	});

	$('fuUpload').addEvent('click', function() {
		swiffy.upload();
		return false;
	});
	
	$$('object[id^=Swiff]')[0].getParent().setStyles({position:'absolute', top:0, left:0 }).inject('fuBrowse', 'after');
	MooRTE.Elements.fuList.init = '';
	MooRTE.Elements.fuUploadBar.click = function(){ 
		console.log('this is:',MooRTE.activeBtn);
		$('fancyUploadSwiff').getParent().inject(MooRTE.activeBtn.getParent().getParent()).setStyles({top:0, left:0})
		//$$('.mifuUploadBar_toolbar')[0].inject(this.getParent().getParent().getNext());
	}
}
applyUploader();

/*
* The fancyUpload class was modified in the following ways::
* the div which houses the swiff was given an ID!
* but this modification is not actually used.
* current multiple instance implementation is very inflexible.  Should check or be passed position, and put it there. 
*/
