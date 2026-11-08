/* External photo URL registry. No generated or bundled photos. */
"use strict";
window.HubPhotos = (() => {
  const urls = {
    "study-together.jpg":
      "https://images.pexels.com/photos/7777691/pexels-photo-7777691.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "programming.jpg":
      "https://images.pexels.com/photos/1921326/pexels-photo-1921326.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "mathematics.jpg":
      "https://images.pexels.com/photos/6238020/pexels-photo-6238020.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "politics.jpg":
      "https://images.pexels.com/photos/21358211/pexels-photo-21358211.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "economics.jpg":
      "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "medicine.jpg":
      "https://images.pexels.com/photos/9574404/pexels-photo-9574404.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "research.jpg":
      "https://images.pexels.com/photos/8199762/pexels-photo-8199762.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "books.jpg":
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=85",
    "library.jpg":
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=85",
    "founder.jpg":
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=85",
    "student.jpg":
      "https://images.pexels.com/photos/7777691/pexels-photo-7777691.jpeg?auto=compress&cs=tinysrgb&w=1400",
  };
  function resolve(name) {
    return urls[name] || urls["books.jpg"];
  }
  return { resolve, urls };
})();
