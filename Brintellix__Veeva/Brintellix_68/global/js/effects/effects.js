require([
    'jquery'
], function($) {
    $.extend($.effects, {
        removeElementChange:function(el, el2, copy)
        {
            if (copy == null) 
                copy = true;
            if(copy==true)
            {
                el.parent().remove();
            }
            else
            {
                var props = [ "left", "top", "display"];
                $.effects.restore( el,props);
                $.effects.restore( el2,props);
                
                el.data("parent").append(el);
                el2.data("parent").append(el2);
            }
        },
        createElementChange: function(el, el2, copy){
            if (copy == null) 
                copy = true;
            var container = $("<div></div>").appendTo(el.parent());
            var width = el.width(), height = el.height(), left = el.css("left"), top = el.css("top"), position = el.css("position");
            var props = [ "left", "top", "display"];
            var property = {
                width: width,
                height: height,
                left: left,
                top: top,
                position: position
            };
            container.css(property);
            
            var reset = {
                left: 0,
                top: 0,
                display: "block"
            }
            var oel, iel;
            if (copy == true) {
                oel = el.clone().css(reset);
                iel = el2.clone().css(reset);
            }
            else {
                el.data("parent",el.parent());
                el2.data("parent",el2.parent());
   
                $.effects.save( el,props);
                $.effects.save( el2,props);
                oel = el.css(reset);
                iel = el2.css(reset);
            }
            var outgoing = $("<div class='outgoing'></div>").appendTo(container).append(oel).css(property).css(reset).css({
                "z-index": 1,
                position: "absolute"
            
            });
            var incoming = $("<div class='incoming'></div>").appendTo(container).append(iel).css(property).css(reset).css({
                "z-index": 0,
                position: "absolute"
            });
            return container;
        }
    });
});
 