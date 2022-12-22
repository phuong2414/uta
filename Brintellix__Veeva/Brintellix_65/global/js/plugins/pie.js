Raphael.fn.pieChart = function (cx, cy, r, values) {
    var paper = this,
        rad = Math.PI / 180,
        chart = this.set();
        
    function sector(cx, cy, r, startAngle, endAngle, params) {
        var x1 = cx + r * Math.cos(-startAngle * rad),
            x2 = cx + r * Math.cos(-endAngle * rad),
            y1 = cy + r * Math.sin(-startAngle * rad),
            y2 = cy + r * Math.sin(-endAngle * rad);
        return paper.path(["M", cx, cy, "L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"]).attr(params);
    }
    
    var angle = 255,
        total = 0,
        start = 0,
        process = function (j) {
            var value = values[j],
                angleplus = 360 * value / total,
                p = sector(cx, cy, r, angle, angle + angleplus, {stroke: 'white', "stroke-width": 0.6});
            angle -= angleplus;
            chart.push(p);
            start += .1;
        };
    
    for (var i = 0, ii = values.length; i < ii; i++) {
        total += values[i];
    }
    for (i = 0; i < ii; i++) {
        process(i);
    }
    return chart;
};
