<?php 
$script = $shrunk = '';
$files = ['Core', 'Range', 'Utilities', 'Extensions', 'Basic', 'Word10'];
require __DIR__ . "/Assets/scripts/JShrink.php";
foreach ($files as $file){
	$js = file_get_contents("$file.js");
	$script .= "\n".$js;
	$shrunk .= "\n".JShrink\Minifier::minify($js);
	//$script .= "\n".JShrink\Minifier::minify($js, array('flaggedComments' => false));
	}
file_put_contents('moorte.js',$script);
file_put_contents('moorte.compressed.js',$shrunk);
echo $script;
?>