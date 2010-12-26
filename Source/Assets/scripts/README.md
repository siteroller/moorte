###Methods:
 - AssetLoader.**javascript**( files [, options] );
 - AssetLoader.**css**( files [, options] );
 - AssetLoader.**images**( files [, options] );
 - AssetLoader.**mixed**( files [, options] );

Usage is the same for all methods (see [Exceptions](#Exceptions)).
Examples and documentation mostly use .css() 
   
###Returns:
[Array] A reference to downloaded files.
 
###Usage:
    AssetLoader.css(files [, options]); 

**files** [mixed] - One file or an array of many files:

Each file can be either: 
 
 - [string] Path to the file, relative to the html page.
 - [object] Object that would be used if creating the element using new Element('link', object).
   - Aside from regular properties, object can include any Options plus a custom [onInit](#onInit) function.

**Options** [object] - Properties that should be applied to all files.

 - chain: Wait till this file is loaded before loading the next file[true], or begin loading the next file immediately [false].
 - onComplete: Function to run once all files are loaded.
 - Path: path that should be prepended to all file paths.		

			
###Examples:
1: *styleOne.css & styleTwo.css will be downloaded and attached.*

	AssetLoader.css('styleOne.css');
	AssetLoader.css({href:'styleTwo.css'});
	// or
	AssetLoader.css(['styleOne.css', {href:'styleTwo.css'}]);  
2: *The stylesheets will be loaded and given the class 'newStyles'.
When both have loaded, the page will alert 'Done!'.*
	
	AssetLoader.css(
	   ['styleOne.css', 'styleTwo.css'],
	   {'class':newStyles', onComplete: function(){ alert('Done!') }}
	);
	
3: *All but styleTwo.css will have a class 'lazy'. 
The paths of all files will begin with 'Assets/', eg. 'Assets/styleOne.js' 
myImage.jpg will not load until styleTwo.css has loaded, as styleTwo has chain:true.*

	var files = [ 
		'styleOne.js',
		{href:'styleOne.css'},
		{href:'styleTwo.css', chain:true, 'class':''},
		'myImage.jpg'
	];
	var options = {
		'class':'lazy',
		path: 'Assets/'
		chain:false
	}
	AssetLoader.mixed(files, options);
	

###Custom Option: onInit
If a file is attached multiple times, it will only be included in the page once, but the onLoad will run each time.  
onInit was created to allow a function that should only be run once.

 - onLoad and onComplete will run each time a file or group of files is attached.  
 - onInit will only run the first time the page is attached.  

###Cases where the methods differ:
 - .mixed() dynamically determines the file type. 
	.css(), .javascript(), and .images() will assume the filetype as declared.
 - chain defaults to true for scripts, false for the others.
 - scripts and styles are included in the page. Images are not.

###Notes:
 - This class will replace the Asset Class that is part of MoTools More, and is 100% backwards compatible. 
    All methods can be called as Asset. Eg. Asset.css() instead of AssetLoader.css(); 
	If you want Asset to exist as its own comment, you must comment out the last line: Asset = AssetLoader;
 - DO NOT add events using addEvent(), instead pass them in using the onLoad event.
 - If a file is passed into 'mixed' that it cannot handle, it will returned as a failed file.
 - The array of loaded files [AssetLoader.assets[loading/scripts/styles/failed] is only formed once.
    if you attach files using another method, take care to update the object.
		eg { src:'myfile.js'
		   , onInit: function(){alert('File being included for the first time.')}
		   , onLoad: function(){alert('File included. Again!')}
		   }