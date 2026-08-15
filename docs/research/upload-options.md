# Paperwork upload options

**Decision for this app:** use two native browser entry points now—**Take a photo** and
**Choose from this device**—and keep the current client-side compression plus session-only
server read. Add multi-page batching only after the extraction contract accepts a page set.
Do not add cloud storage, remote-drive connectors, or a resumable-upload dependency to the
hackathon flow.

## What the primary sources say

### 1. Native file input + camera capture — best current fit

`<input type="file">` can advertise image and PDF types through `accept`, and `multiple` can
let the user select more than one file. The browser hint is not validation, so the server still
has to validate the actual media type and size. [MDN: `<input type="file">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file)

The HTML Media Capture `capture="environment"` hint requests the outward-facing camera when
the accepted type is image or video. It works better on mobile, but it is not Baseline and a
desktop browser may show an ordinary picker instead. [MDN: `capture` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture)

That leads to two controls rather than one overloaded control:

| User intent | Control | Why |
|---|---|---|
| The paper is on the counter | `accept="image/*" capture="environment"` | Fastest path to a fresh, rear-camera photo |
| The paper is already in Photos/Files | `accept="image/*"` without `capture` | Lets the user choose an existing image without depending on capture behavior |

This is the option implemented in the app. It adds no dependency, preserves the current
compression path, works on the phone used for the demo, and keeps the document in memory for
the session rather than creating a retention system.

### 2. Multi-page image selection — the next product step

The native control can select multiple images, but this app currently sends one image to a
one-page extraction route. We should not expose `multiple` until the app can preserve page order,
show the selected pages, reject an incomplete set, and pass all pages through a clearly defined
extraction contract. A multi-page UI is useful for a real discharge file; it is not a safe
one-line attribute change.

### 3. Uppy + Tus — best when reliability and upload UX dominate

Uppy provides a ready-made dashboard with local files, drag-and-drop, metadata, image editing,
and optional webcam or remote-source plugins. [Uppy Dashboard](https://uppy.io/docs/dashboard/)
It also supports resumable uploads through the open Tus protocol. [Uppy overview](https://uppy.io/)

Tus defines resumable HTTP uploads so an interrupted upload can continue from its stored offset.
[Tus resumable upload protocol](https://tus.io/protocols/resumable-upload)

This is a good production choice for large, multi-page files or unreliable connectivity, but it
would add a dependency, a server-side upload endpoint, and a storage/retention decision. It is
not the right default while the product explicitly promises session-only handling.

### 4. Direct object-storage upload — production scale, not session-only by default

Amazon S3 presigned URLs authorize a browser to upload a specific object for a limited time
without giving the browser AWS credentials. [AWS S3 presigned uploads](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
Cloudflare R2 offers the same S3-compatible pattern and explicitly warns that a presigned URL
is a bearer token; R2 also supports direct browser `PUT` uploads but not HTML-form `POST`
uploads. [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

This is the right architecture only when the app has a deliberate PHI storage posture: short
expiry, private objects, scoped keys, encryption, access audit, deletion after processing, and
a tested lifecycle. Without those controls, moving a discharge photo from the Next route into a
bucket would contradict the current product promise.

### 5. File System Access / OPFS — useful for resumable local work, with privacy tradeoffs

The File System API can support local upload state that survives interruptions, including an
upload restarted after connectivity loss or a closed browser. It requires a secure context and
explicit permission for user files. [MDN: File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)

That persistence is valuable for a long, multi-page workflow, but local persistence is still a
privacy decision for medical paperwork. It is not needed for the current single-photo, read-and-
act journey.

## Recommendation ladder

1. **Now:** native camera/file split, client-side compression, strict server validation, no
   persistence. This is what the app uses.
2. **Next:** multi-page image intake with thumbnails, order, per-page retry, and a page-set API.
3. **If network failures become the blocker:** Uppy + Tus, with a session-scoped temporary store.
4. **Only with governance:** S3/R2 presigned uploads and a deletion/audit policy.

PDF upload is a separate capability, not just another `accept` value. The current vision route
expects one image and the browser cannot turn an arbitrary PDF into a model-ready image without
an additional conversion path. Keep the committed PDF as a demo asset until that contract is
implemented and evaluated.
