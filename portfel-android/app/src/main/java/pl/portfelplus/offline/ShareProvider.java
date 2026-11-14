package pl.portfelplus.offline;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;
public class ShareProvider extends ContentProvider {
 @Override public boolean onCreate(){return true;}
 private File resolve(Uri uri) throws FileNotFoundException {
  String segment=uri.getLastPathSegment();
  if("PORTFEL_PLUS.apk".equals(segment))return new File(getContext().getApplicationInfo().sourceDir);
  if("PORTFEL_SYNC.portfel".equals(segment))return new File(getContext().getCacheDir(),"PORTFEL_SYNC.portfel");
  throw new FileNotFoundException("Unsupported file");
 }
 @Override public String getType(Uri uri){return "PORTFEL_PLUS.apk".equals(uri.getLastPathSegment())?"application/vnd.android.package-archive":"application/octet-stream";}
 @Override public ParcelFileDescriptor openFile(Uri uri,String mode)throws FileNotFoundException{
  if(!"r".equals(mode))throw new FileNotFoundException("Read only");
  return ParcelFileDescriptor.open(resolve(uri),ParcelFileDescriptor.MODE_READ_ONLY);
 }
 @Override public Cursor query(Uri uri,String[] projection,String selection,String[] selectionArgs,String sortOrder){
  String[] cols=projection==null?new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE}:projection;
  MatrixCursor c=new MatrixCursor(cols);Object[] row=new Object[cols.length];
  try{File file=resolve(uri);for(int i=0;i<cols.length;i++){if(OpenableColumns.DISPLAY_NAME.equals(cols[i]))row[i]="PORTFEL_PLUS.apk".equals(uri.getLastPathSegment())?"PORTFEL_PLUS.apk":"PORTFEL_SYNC.portfel";else if(OpenableColumns.SIZE.equals(cols[i]))row[i]=file.length();}}catch(Exception ignored){}
  c.addRow(row);return c;
 }
 @Override public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}
 @Override public int delete(Uri u,String s,String[] a){throw new UnsupportedOperationException();}
 @Override public int update(Uri u,ContentValues v,String s,String[] a){throw new UnsupportedOperationException();}
}