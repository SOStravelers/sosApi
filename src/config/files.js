export default {
  maxSize: {
    profile: 100 * 1024 * 1024,
    gallery: 100 * 1024 * 1024,
  },
  profile: {
    maxsize: 100 * 1024 * 1024,
    formats: ["image/jpg", "image/jpeg", "image/png", "image/svg"],
  },
  gallery: {
    maxsize: 100 * 1024 * 1024,
    formats: [
      "image/jpg",
      "image/jpeg",
      "image/png",
      "image/svg",
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/quicktime",
      "video/webm",
    ],
  },
};
