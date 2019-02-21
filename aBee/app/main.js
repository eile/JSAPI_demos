require([
  "dojo/has",
  "esri/config",
  "esri/WebScene",
  "esri/layers/Layer",
  "esri/views/SceneView",
  "app/syncUtil"
], function (has, config, WebScene, Layer, SceneView, syncUtil) {

  var params = {};
  var parts = window.parent.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    params[key] = value;
  });

  has.add("disable-feature:single-idb-cache", 1);

  var portal = params["portal"];
  if (portal) {
    config.portalUrl = portal;
  }

  var url =  params["url"]
  var webscene;
  if (url) {
    webscene = new WebScene({basemap: "topo", ground: "world-elevation"});
    Layer.fromArcGISServerUrl({url: url}).then(function(layer){
      webscene.layers.add(layer);
      layer.when(function(){
        return layer.queryExtent();
      })
      .then(function(response){
        view.goTo(response.extent);
      });
    });
  } else {
    webscene = params["webscene"] || "46c47340708f446ba7f112f139e8ae5e";
    webscene = new WebScene({ portalItem: { id: webscene }});
  }

  var view = new SceneView({
    container: "view",
    map: webscene,
  });

  // Clear the top-left corner to make place for the title
  view.ui.empty("top-left");

  // synchronize the two views
  syncUtil.syncView(view);

  var slidesDiv = document.getElementById("slides");
  if (slidesDiv) {
    // The view must be ready (or resolved) before you can
    // access the properties of the WebScene
    view.when(function() {

      // The slides are a collection inside the presentation
      // property of the WebScene
      var slides = webscene.presentation.slides;

      // Loop through each slide in the collection
      slides.forEach(function(slide) {

        // Create a new <div> element for each slide and place the title of
        // the slide in the element.
        var slideElement = document.createElement("div");
        slideElement.id = slide.id;
        slideElement.classList.add("slide");

        // Create a new <img> element and place it inside the newly created <div>.
        // This will reference the thumbnail from the slide.
        var img = new Image();
        img.src = slide.thumbnail.url;
        img.title = slide.title.text;
        slideElement.appendChild(img);
        slidesDiv.appendChild(slideElement);

        slideElement.addEventListener("click", function() {
          slide.applyTo(view);
          syncUtil.syncSlide(slide.id);
        });
      });
    });
  }

  mc = view.resourceController._memoryController
  view.resourceController.memoryEvents.on("memory-used", function()  {
    document.getElementById("stats").innerHTML = 
      "Memory: " + (mc._memoryUsed * mc._maxMemory).toFixed() + " of " + mc._maxMemory.toFixed() + "MB<br>" +
      "Cache: " + (mc._cacheStorage._size / 1048576).toFixed() + " of " + (mc._cacheStorage._maxSize / 1048576).toFixed() + "MB<br>";
  });
});
