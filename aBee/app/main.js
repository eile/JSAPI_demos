require([
  "dojo/has",
  "esri/config",
  "esri/request",
  "esri/WebScene",
  "esri/core/watchUtils",
  "esri/layers/Layer",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/views/support/waitForResources",
  "app/syncUtil"
], function(has, config, esriRequest, WebScene, watchUtils, Layer, MapView, SceneView, waitForResources, syncUtil) {
  var params = {};
  var parts = window.parent.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
    params[key] = value;
  });

  has.add("disable-feature:single-idb-cache", 1);

  var portal = params["portal"];
  if (portal) {
    config.portalUrl = portal;
  }

  var sceneView = document.getElementById("SceneView");
  var view = sceneView
    ? new SceneView({ container: "SceneView", map: webscene })
    : new MapView({ container: "MapView", map: webscene, constraints: { snapToZoom: false } });
  var url = params["url"];
  var animate = params["animate"];

  if (url) {
    view.map = new WebScene({ basemap: "topo", ground: "world-elevation" });
    Layer.fromArcGISServerUrl({ url: url }).then(function(layer) {
      view.map.layers.add(layer);
      layer
        .when(function() {
          return layer.queryExtent();
        })
        .then(function(response) {
          view.goTo(response.extent);
        });
    });
  } else {
    var webscene = params["webscene"] || "46c47340708f446ba7f112f139e8ae5e";
    if (webscene.startsWith("http")) {
      esriRequest(webscene).then(function(json) {
        view.map = WebScene.fromJSON(json.data);
      });
    } else {
      view.map = new WebScene({ portalItem: { id: webscene } });
    }
  }

  // Clear the top-left corner to make place for the title
  view.ui.empty("top-left");

  // synchronize the two views
  if (!animate) {
    syncUtil.syncView(view);
  }

  // The view must be ready (or resolved) before you can
  // access the properties of the WebScene
  view.when(function() {
    var slides = view.map.presentation.slides;

    if (!!animate) {
      var current = -1;
      function nextSlide() {
        ++current;
        if (current >= slides.length) {
          return;
        }

        slides.getItemAt(current).applyTo(view);
        waitForResources(view, nextSlide);
      }

      waitForResources(view, nextSlide);
      return;
    }

    var slidesDiv = document.getElementById("slides");
    if (slidesDiv) {
      // The slides are a collection inside the presentation property of the WebScene

      slides.forEach(function(slide) {
        // Create a new <div> element for each slide and place the title of the slide in the element.
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
    }
  });

  function updateStats() {
    setTimeout(updateStats, 1000);
    var textContent = "";

    if (view.getStats) {
      var stats = view.getStats();
      var keys = Object.keys(stats);
      for (var i = 0; i < keys.length; ++i) {
        textContent += "<br/>" + keys[i] + ": " + stats[keys[i]];
      }
    } else {
      var rc = view.resourceController;
      var mc = rc.memoryController || rc._memoryController;
      if (mc && mc._cacheStorage) {
        textContent =
          "Memory: " +
          (mc._memoryUsed * mc._maxMemory).toFixed() +
          " of " +
          mc._maxMemory.toFixed() +
          "MB<br>" +
          "Cache: " +
          (mc._cacheStorage._size / 1048576).toFixed() +
          " of " +
          (mc._cacheStorage._maxSize / 1048576).toFixed() +
          "MB<br>";
      }
    }
    document.getElementById("stats").innerHTML = textContent;
  }

  sceneView &&
    watchUtils.whenTrueOnce(view, "ready").then(function() {
      setTimeout(updateStats, 1);
    });
});
