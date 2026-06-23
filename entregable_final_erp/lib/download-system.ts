/**
 * Robust system to trigger file downloads from Blobs.
 * Primary:  Uses showSaveFilePicker (Chrome's native OS save dialog - 100% reliable).
 * Fallback: Uses anchor link injection (Safari and older browsers).
 */

function getMimeType(filename: string): string {
  if (filename.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (filename.endsWith('.pdf')) return 'application/pdf';
  if (filename.endsWith('.csv')) return 'text/csv';
  return 'application/octet-stream';
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  // Re-create blob with exact MIME type for correct file recognition
  const mimeType = getMimeType(filename);
  const typedBlob = new Blob([blob], { type: mimeType });

  // METHOD 1: showSaveFilePicker — Opens native macOS/Windows save dialog
  // This is bulletproof because the USER directly interacts with the OS
  if ('showSaveFilePicker' in window) {
    try {
      const extension = getFileExtension(filename);
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: extension.toUpperCase() + ' File',
          accept: { [mimeType]: ['.' + extension] }
        }]
      });
      const writable = await fileHandle.createWritable();
      await writable.write(typedBlob);
      await writable.close();
      return;
    } catch (err: any) {
      // User cancelled — do nothing
      if (err.name === 'AbortError') return;
      // Real error — fall through to method 2
      console.warn('showSaveFilePicker failed, using fallback:', err);
    }
  }

  // METHOD 2: Anchor link fallback for Safari and other browsers
  const url = URL.createObjectURL(typedBlob);
  const link = document.createElement('a');
  link.style.cssText = 'position:fixed;top:-1px;left:-1px;width:1px;height:1px;opacity:0;';
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 5000);
}
