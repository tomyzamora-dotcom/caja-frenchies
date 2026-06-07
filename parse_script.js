var fso = new ActiveXObject("Scripting.FileSystemObject");
var file = fso.OpenTextFile("script.js", 1, false, -1);
var code = file.ReadAll();
file.Close();
try {
  new Function(code);
  WScript.Echo("OK");
} catch(e) {
  WScript.Echo("ERR:" + e.message);
}
