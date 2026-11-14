package pl.portfelplus.offline;
import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.text.InputType;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.webkit.JavascriptInterface;
import android.util.Base64;
import java.nio.charset.StandardCharsets;
import java.io.OutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
public class MainActivity extends Activity {
 private WebView web;
 private ValueCallback<Uri[]> fileCallback;
 private static final int FILE_PICK=12;
 private static final int EXPORT_FILE=13;
 private byte[] pendingExport;
 private String pendingMime;
 @Override public void onCreate(Bundle state){super.onCreate(state);
 web=new WebView(this);setContentView(web);
 web.addJavascriptInterface(new Object(){
 @JavascriptInterface public void shareSyncOnly(String base64){
 runOnUiThread(()->{try{
 byte[] data=Base64.decode(base64,Base64.DEFAULT);
 if(data.length>20*1024*1024)throw new Exception("Plik synchronizacji jest za duży");
 File file=new File(getCacheDir(),"PORTFEL_SYNC.portfel");
 try(FileOutputStream out=new FileOutputStream(file)){out.write(data);}
 Uri uri=new Uri.Builder().scheme("content").authority(getPackageName()+".share").appendPath("PORTFEL_SYNC.portfel").build();
 Intent send=new Intent(Intent.ACTION_SEND);
 send.setType("application/octet-stream");
 send.putExtra(Intent.EXTRA_STREAM,uri);
 send.putExtra(Intent.EXTRA_SUBJECT,"PORTFEL+ · plik synchronizacji");
 send.putExtra(Intent.EXTRA_TEXT,"Plik synchronizacji PORTFEL+. Otwórz PORTFEL+ → Ustawienia → Synchronizacja → Scal plik .portfel.");
 send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
 send.setClipData(android.content.ClipData.newUri(getContentResolver(),"PORTFEL_SYNC.portfel",uri));
 startActivity(Intent.createChooser(send,"Wyślij synchronizację PORTFEL+"));
 }catch(Exception ex){new AlertDialog.Builder(MainActivity.this).setTitle("Wysyłanie synchronizacji").setMessage(ex.getMessage()).setPositiveButton("OK",null).show();}});
 }
 @JavascriptInterface public void shareInstallAndSync(String base64){shareInstallAndSyncTo(base64,"","");}
 @JavascriptInterface public void shareInstallAndSyncTo(String base64,String email,String name){
 runOnUiThread(()->{try{
 byte[] data=Base64.decode(base64,Base64.DEFAULT);
 if(data.length>20*1024*1024)throw new Exception("Plik synchronizacji jest za duży");
 File file=new File(getCacheDir(),"PORTFEL_SYNC.portfel");
 try(FileOutputStream out=new FileOutputStream(file)){out.write(data);}
 String authority=getPackageName()+".share";
 Uri apk=new Uri.Builder().scheme("content").authority(authority).appendPath("PORTFEL_PLUS.apk").build();
 Uri sync=new Uri.Builder().scheme("content").authority(authority).appendPath("PORTFEL_SYNC.portfel").build();
 ArrayList<Uri> attachments=new ArrayList<>();attachments.add(apk);attachments.add(sync);
 Intent send=new Intent(Intent.ACTION_SEND_MULTIPLE);
 send.setType("application/octet-stream");send.putParcelableArrayListExtra(Intent.EXTRA_STREAM,attachments);
 send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
 android.content.ClipData clip=new android.content.ClipData("PORTFEL+ files",new String[]{"application/octet-stream"},new android.content.ClipData.Item(apk));
 clip.addItem(new android.content.ClipData.Item(sync));send.setClipData(clip);
 send.putExtra(Intent.EXTRA_SUBJECT,"PORTFEL+ · instalator i synchronizacja");
 if(email!=null&&!email.trim().isEmpty())send.putExtra(Intent.EXTRA_EMAIL,new String[]{email.trim()});
 send.putExtra(Intent.EXTRA_TEXT,"PORTFEL_PLUS.apk: instalator Android. PORTFEL_SYNC.portfel: plik do scalenia danych w aplikacji. Importuj tylko pliki od zaufanych osób.");
 startActivity(Intent.createChooser(send,"Udostępnij PORTFEL+"));
 }catch(Exception ex){new AlertDialog.Builder(MainActivity.this).setTitle("Udostępnianie PORTFEL+").setMessage(ex.getMessage()).setPositiveButton("OK",null).show();}});
 }
 @JavascriptInterface public void exportFile(String filename,String mime,String base64){
 runOnUiThread(()->{try{pendingExport=Base64.decode(base64,Base64.DEFAULT);pendingMime=mime;
 Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType(mime);intent.putExtra(Intent.EXTRA_TITLE,filename);
 startActivityForResult(intent,EXPORT_FILE);
 }catch(Exception ex){pendingExport=null;new AlertDialog.Builder(MainActivity.this).setTitle("PORTFEL+").setMessage("Nie można rozpocząć eksportu: "+ex.getMessage()).setPositiveButton("OK",null).show();}});
 }
 },"PortfelAndroid");
 WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(true);
 web.setWebChromeClient(new WebChromeClient(){
 @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams params){if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=cb;try{Intent i=params.createIntent();startActivityForResult(i,FILE_PICK);return true;}catch(Exception e){fileCallback=null;return false;}}
 @Override public boolean onJsPrompt(WebView view,String url,String message,String defaultValue,JsPromptResult result){
 EditText input=new EditText(MainActivity.this);
 input.setSingleLine(true);
 input.setText(defaultValue==null?"":defaultValue);
 if(message!=null&&message.toLowerCase(java.util.Locale.ROOT).contains("pin")) input.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_VARIATION_PASSWORD);
 else input.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
 LinearLayout layout=new LinearLayout(MainActivity.this);layout.setOrientation(LinearLayout.VERTICAL);
 int pad=(int)(20*getResources().getDisplayMetrics().density);layout.setPadding(pad,0,pad,0);layout.addView(input);
 AlertDialog dialog=new AlertDialog.Builder(MainActivity.this).setTitle("PORTFEL+").setMessage(message).setView(layout)
 .setPositiveButton("Zapisz",(d,w)->result.confirm(input.getText().toString()))
 .setNegativeButton("Anuluj",(d,w)->result.cancel()).create();
 dialog.setOnCancelListener(d->result.cancel());dialog.show();return true;
 }
 @Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result){
 AlertDialog dialog=new AlertDialog.Builder(MainActivity.this).setTitle("PORTFEL+").setMessage(message)
 .setPositiveButton("Potwierdź",(d,w)->result.confirm()).setNegativeButton("Anuluj",(d,w)->result.cancel()).create();
 dialog.setOnCancelListener(d->result.cancel());dialog.show();return true;
 }
 @Override public boolean onJsAlert(WebView view,String url,String message,JsResult result){
 AlertDialog dialog=new AlertDialog.Builder(MainActivity.this).setTitle("PORTFEL+").setMessage(message)
 .setPositiveButton("OK",(d,w)->result.confirm()).create();
 dialog.setOnCancelListener(d->result.confirm());dialog.show();return true;
 }
 });
 web.loadUrl("file:///android_asset/index.html");
 web.setWebViewClient(new android.webkit.WebViewClient(){@Override public void onPageFinished(WebView v,String url){handleIncoming(getIntent());}});
 }
 @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);handleIncoming(intent);}
 private void handleIncoming(Intent intent){
 if(intent==null)return;
 String action=intent.getAction();if(!Intent.ACTION_VIEW.equals(action)&&!Intent.ACTION_SEND.equals(action))return;
 Uri uri=Intent.ACTION_VIEW.equals(action)?intent.getData():(Uri)intent.getParcelableExtra(Intent.EXTRA_STREAM);
 if(uri==null)return;
 try{
 String name="";
 try(android.database.Cursor cursor=getContentResolver().query(uri,new String[]{android.provider.OpenableColumns.DISPLAY_NAME},null,null,null)){
 if(cursor!=null&&cursor.moveToFirst())name=cursor.getString(0);
 }catch(Exception ignored){}
 if(name==null)name="";
 if(!name.toLowerCase(java.util.Locale.ROOT).endsWith(".portfel")){new AlertDialog.Builder(this).setMessage("To nie jest plik .portfel.").setPositiveButton("OK",null).show();return;}
 ByteArrayOutputStream out=new ByteArrayOutputStream();
 try(InputStream in=getContentResolver().openInputStream(uri)){if(in==null)throw new Exception("Nie można odczytać pliku");byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){out.write(buffer,0,n);if(out.size()>20*1024*1024)throw new Exception("Plik jest zbyt duży");}}
 String encoded=Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP);
 new AlertDialog.Builder(this).setTitle("PORTFEL+ · synchronizacja").setMessage("Wczytać otrzymany plik .portfel i scalić wspólne dane?").setPositiveButton("Scal", (d,w)->web.evaluateJavascript("window.portfelImportFromAndroid('"+encoded+"')",null)).setNegativeButton("Anuluj",null).show();
 }catch(Exception e){new AlertDialog.Builder(this).setTitle("Błąd pliku").setMessage(e.getMessage()).setPositiveButton("OK",null).show();}
 }
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==EXPORT_FILE){if(result==RESULT_OK&&data!=null&&data.getData()!=null&&pendingExport!=null){try(OutputStream out=getContentResolver().openOutputStream(data.getData())){if(out==null)throw new Exception("Nie można otworzyć pliku");out.write(pendingExport);new AlertDialog.Builder(this).setTitle("PORTFEL+").setMessage("Kopia danych została zapisana.").setPositiveButton("OK",null).show();}catch(Exception e){new AlertDialog.Builder(this).setTitle("Błąd eksportu").setMessage(e.getMessage()).setPositiveButton("OK",null).show();}}pendingExport=null;return;}if(request==FILE_PICK&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;}}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
}