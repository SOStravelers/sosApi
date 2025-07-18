// config/uploadTypes.js
export const SUPPORTED_IMG_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const isValidImage = (mime) => SUPPORTED_IMG_TYPES.includes(mime);
export const isValidVideo = (mime) => mime.startsWith("video/");
