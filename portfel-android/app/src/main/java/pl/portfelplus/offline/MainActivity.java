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
public class MainActivity extends Activity {
 private WebView web;
 private ValueCallback<Uri[]> fileCallback;
 private static final int FILE_PICK=12;
 @Override public void onCreate(Bundle state){super.onCreate(state);
 web=new WebView(this);setContentView(web);
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
 }
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==FILE_PICK&&fileCallback!=null){fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data));fileCallback=null;}}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
}