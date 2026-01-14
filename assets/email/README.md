# Email assets

Place optional email images here.

- EMAIL_HEADER_IMAGE_PATH → absolute path to a full-width header image (PNG/JPG). Example:
  - `e:\project\project cata\assets\email\header.png`
- EMAIL_LOGO_PATH → absolute path to a small logo used in the brand bar fallback.

Alternatively, skip local files and set EMAIL_HEADER_IMAGE_URL to host the image remotely (it will be referenced directly in the email, no attachment needed).

Notes
- Prefer ~1200×320 (or similar 3–4:1 ratio) for header images.
- Keep file sizes small (<200KB) for better deliverability.
- CID attachments (PATH) generally render offline; remote URLs (URL) may be blocked by some clients until the user displays images.