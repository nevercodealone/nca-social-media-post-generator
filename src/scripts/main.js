import { SocialMediaApp } from "./app.js";
import { VideoUploadApp } from "./video-upload.js";

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SocialMediaApp();
  new VideoUploadApp();
});
