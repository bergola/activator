define([
  "services/fs",
  "main/plugins",
  "text!./code.html",
  "widgets/layout/layout",
  "widgets/browser/browser",
  "./document",
  "widgets/editor/editor",
  "css!./code",
  "css!widgets/intro/intro",
  "css!widgets/buttons/button"
], function(
  fs,
  plugins,
  tpl,
  layout,
  browser,
  documentState,
  editor
){

  var openedDocuments = ko.observableArray([]);
  var selectedDocument = ko.observable();
  var visible = ko.computed(function(){
    return !!openedDocuments().length;
  });

  var openFile = function(e) {
    var foundDocIndex, doc;
    // Is it loaded already?
    for (var index in openedDocuments()){
      doc = openedDocuments()[index];
      if (doc.location == e.data.scope.location){
        foundDocIndex = parseInt(index);
        break;
      }
    }
    if (foundDocIndex === undefined){
      doc = new documentState(e.data.scope);
      openedDocuments.push(doc);
    }
    makeActive(doc);
  }

  var closeFile = function(doc, event) {
    event.preventDefault();
    event.stopPropagation();
    var docIndex = openedDocuments.indexOf(doc);
    if (docIndex >= 0){
      var sel = selectedDocument();
      if (doc.location == sel.location){
        if (openedDocuments().length > 1){
          makeActive(openedDocuments()[
            // Activate the closest document
            docIndex == openedDocuments().length -1
              ? docIndex-1
              : docIndex+1
          ]);
        } else {
          // It was the only document, nothing to activate
          makeActive(null);
        }
      }
      openedDocuments.splice(docIndex, 1);
    }
  }

  var makeActive = function(doc) { // doc might be null
    var sel = selectedDocument();
    if (sel) sel.active(false);
    if (doc){
      doc.active(true);
      window.location.hash = "code"+fs.relative(doc.location);
    } else {
      window.location.hash = "code/";
    }
    selectedDocument(doc);
  }

  var State = {
    browser: browser,
    editor: editor,
    openedDocuments: openedDocuments,
    openFile: openFile,
    closeFile: closeFile,
    selectedDocument: selectedDocument,
    makeActive: makeActive,
    visible: visible
  }

  return {

    render: function(url) {
      layout.renderPlugin(bindhtml(tpl, State))
    },

    route: function(url, breadcrumb) {
      var all = [['code/', "Code"]];
      breadcrumb(all.concat([["code/"+url.parameters.join("/"),url.parameters.join("/")]]));
      if (url.parameters[0]){
        openFile({data:{scope:{
          title: url.parameters[url.parameters.length-1],
          location: fs.absolute("/"+url.parameters.join("/"))
        }}});
      } else if (!selectedDocument()){
        breadcrumb(all);
        window.location.hash = "code/";
      }
    },

    keyboard: function(key, meta) {
      var focus = $("#wrapper .browser span.focus");
      if (key == "BOTTOM"){
        var all = $("#wrapper .browser span:visible");
        var index = all.index(focus);
        focus.removeClass("focus");
        all.eq( index<all.length?index+1:0 ).addClass("focus");
      } else if (key == "TOP"){
        var all = $("#wrapper .browser span:visible");
        var index = all.index(focus);
        focus.removeClass("focus");
        all.eq( index>0?index-1:all.length ).addClass("focus");
      } else if (key == "RIGHT"){
        if (!focus.parent().hasClass("open"))
          focus.trigger("click");
      } else if (key == "LEFT"){
        if(focus.parent().is(".directory.open")) focus.trigger("click");
        else {
          if (focus.parents(".directory.open:first").find("span:first").addClass("focus").length)
            focus.removeClass("focus");
        }
      }

    }
  }
});
