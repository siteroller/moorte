Replacement for the More Asset Class.

Methods:
 - Load Javascript Files
   AssetLoader.javascript(files [, options]);
 - Load External Stylesheets
   AssetLoader.css(files [, options]);
 - Load Images
   AssetLoader.images(files [, options]);
 - Load all types of assets
   AssetLoader.mixed(files [, options]);

Usage is the same for all methods (see <a href='#Exceptions'>Exceptions</a>).
Examples and documentation mostly use .css() 
   
Returns:
An object with a reference to downloaded files.
 
Usage
AssetLoader.css(files [, options]);

files [mixed]:
	One file or an array of many files:
		 - AssetLoader.css('styleOne.css');
		 - AssetLoader.css(['styleOne.css', {href:'styleTwo.css'}]);
	Each file can be either:
		string - path to the JS/CSS file, relative to the html page.  eg 'Assets/myscripts.js'.
		object - object that would be used if creating the element using new Element('link', object).
			See Options. All options and <a href='#onInit>'onInit</a> can be included on a per-file basis.
			eg. {href:'Assets/myStyles.css', events:{onLoad: myFunc}}
			
options [object]:
	Properties that should be applied to all files.
	Options:
		 - chain: Wait till this file is loaded before loading the next file[true], or begin loading the next file immediately [false].
		 - onComplete: Function to run once all files are loaded.
		 - Path: path that should be prepended to all file paths.		
			
Examples:
AssetLoader.css(
	['styleOne.css', 'styleTwo.css'],
	{'class':newStyles', onComplete: function(){ alert('Done!') }}
);
The two stylesheets will be loaded and given the class 'newStyles'.
When both have loaded, the page will alert 'Done!'.

AssetLoader.mixed(
	['styleOne.js', {href:'styleTwo.css'}, {href:'styleThree.css', chain:true, 'class':''}, 'myImage.jpg'],
	{'class':'lazy', chain:false}
);

Scripts, styles, and images will all be loaded.
All but the third file will have a class 'lazy'. 
The fourth file will not load until the third has loaded, as the third file has chain:true.

Custom Option: onInit
	If a file is attached multiple times, it will only be included in the page once.
	onLoad and onComplete will run each time it is attached.
	onInit will only run the first time the page is attached.

Exceptions:
 - .mixed() dynamically determines the file type. [AssetLoader.mixed(['script.js', 'style.css'])]
	.css(), .javascript(), and .images() will assume the filetype as declared.
 - chain defaults to true for scripts, false for the others.
 - scripts and styles are included in the page. Images are not.

Notes:
 - This class was designed to replace the Asset Class that is part of MoTools More, and is 100% backwards compatible.
   Uncomment the line Asset = AssetLoader; and it will handle all calls to Asset.
 - DO NOT add events using addEvent(), instead pass them in using the onLoad event.
 - If a file is passed into 'mixed' that it cannot handle, it will returned as a failed file.
 - The array of loaded files [AssetLoader.assets[loading/scripts/styles/failed] is only formed once.
    if you attach files using another method, take care to update the object.
		eg { src:'myfile.js'
		   , onInit: function(){alert('File being included for the first time.')}
		   , onLoad: function(){alert('File included. Again!')}
		   }